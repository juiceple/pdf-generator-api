const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

// JSON 파싱 설정
app.use(express.json({ limit: '10mb' }));

// Render.com에서 필요한 Puppeteer 설정
const getPuppeteerOptions = () => ({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--single-process'
  ],
  headless: 'new',  // 새로운 headless 모드 사용
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null // Render의 Chrome 경로 사용
});

app.post('/generate-pdf', async (req, res) => {
  const { html, css } = req.body;
  let browser = null;
  let page = null;

  if (!html) {
    return res.status(400).json({ error: 'HTML 내용이 필요합니다' });
  }

  try {
    // Puppeteer 브라우저 실행
    browser = await puppeteer.launch(getPuppeteerOptions());
    page = await browser.newPage();

    // 기본 타임아웃 설정
    page.setDefaultNavigationTimeout(0);
    await page.setViewport({ width: 1200, height: 800 });

    // HTML 콘텐츠 설정
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // CSS 적용
    if (css) {
      await page.addStyleTag({ content: css });
    }

    // PDF 생성
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });

    res.contentType('application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF 생성 오류:', error);
    res.status(500).json({
      error: 'PDF 생성 실패',
      details: error.message
    });

  } finally {
    // 리소스 정리
    if (page) await page.close();
    if (browser) await browser.close();
  }
});

// 상태 확인용 엔드포인트
app.get('/', (req, res) => {
  res.send('PDF Generator Service is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});