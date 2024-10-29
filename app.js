const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.post('/generate-pdf', async (req, res) => {
  const { html, css } = req.body;

  if (!html) {
    return res.status(400).send('HTML content is required');
  }

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(html);

    // If CSS is provided, add it to the page
    if (css) {
      await page.evaluate((css) => {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
      }, css);
    }

    // Generate PDF
    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();

    // Send the PDF as a response
    res.contentType('application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});