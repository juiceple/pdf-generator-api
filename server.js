const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();

// CORS 및 JSON 파싱 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/generate-pdf', async (req, res) => {
  console.log('PDF 생성 요청 받음');
  
  try {
    const { html, css, inlineStyles, computedStyles } = req.body;

    if (!html) {
      console.log('HTML 내용 누락');
      return res.status(400).json({ message: 'HTML 내용이 필요합니다' });
    }

    // HTML 템플릿 생성
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>${css || ''}</style>
          <style>${inlineStyles || ''}</style>
          <style>${computedStyles || ''}</style>
        </head>
        <body>${html}</body>
      </html>
    `;

    // Puppeteer 브라우저 실행
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // HTML 콘텐츠 설정
      await page.setContent(fullHtml, {
        waitUntil: ['domcontentloaded', 'networkidle0']
      });

      // PDF 생성 옵션
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      };

      // PDF 생성
      const pdf = await page.pdf(pdfOptions);
      
      // 응답 헤더 설정
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      
      // PDF 전송
      res.send(pdf);

    } finally {
      // 브라우저 종료
      await browser.close();
    }

  } catch (error) {
    console.error('PDF 생성 오류:', error);
    res.status(500).json({
      message: '서버 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF 생성 서버가 포트 ${PORT}에서 실행 중입니다`);
});