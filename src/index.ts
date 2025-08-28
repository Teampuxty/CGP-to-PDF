import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
const chromePath = path.join(
  process.resourcesPath,
  'chrome',
  'win64-139.0.7258.138',
  'chrome-win64',
  'chrome.exe'
);
import PDFMerger from 'pdf-merger-js';
import imageSize from 'image-size';
import { Book } from './modules/Book';
import { FormatPageTemplate } from './modules/Utilities';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 550,
    height: 550,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.resolve(__dirname, '../renderer/main_window/preload.js'),
    },
  });
  win.loadURL(path.resolve(__dirname, '../renderer/main_window/index.html'));
};

app.whenReady().then(createWindow);

ipcMain.handle('rip-book', async (event, options) => {
  const { sessionId, book, pages, quality, uni } = options;

  try {
    const outputPath = path.join(app.getPath('desktop'), 'cgp-output');
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

    const { CloudFrontCookies } = await Book.GenerateCloudFront(book, sessionId);
    const bookInstance = new Book({ BookId: book, CloudFront: CloudFrontCookies });

    const merger = new PDFMerger();
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
    });
    const [page] = await browser.pages();

    for (let i = 1; i <= pages; i++) {
      event.sender.send('rip-progress', { current: i, total: pages });

      const SVGBuffer = await bookInstance.GetSVG(i, true, outputPath, uni).catch(() => undefined);
      const ImageBuffer = await bookInstance.GetBackground(i, true, outputPath, quality);
      const SVGUrl = SVGBuffer && `data:image/svg+xml;base64,${SVGBuffer.toString('base64')}`;
      const ImageUrl = `data:image/${ImageBuffer.BackgroundFType.toLowerCase()};base64,${ImageBuffer.Background.toString('base64')}`;
      const dims = imageSize(ImageBuffer.Background);
      const html = FormatPageTemplate(
        dims.height?.toString() || '',
        dims.width?.toString() || '',
        ImageUrl,
        SVGUrl
      );

      await page.setContent(html);
      const pdfBuffer = await page.pdf({ height: dims.height, width: dims.width });
      await merger.add(Buffer.from(pdfBuffer));
    }

    await browser.close();
    const finalPath = path.join(outputPath, `${book}.pdf`);
    await merger.save(finalPath);

    return `✅ Book ripped successfully to: ${finalPath}`;
  } catch (err: any) {
    console.error('Rip failed:', err);
    return `❌ Rip failed: ${err.message}`;
  }
});
