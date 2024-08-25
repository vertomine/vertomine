const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// 中间件：解析 JSON 请求
app.use(express.json());

// 日志保存路径
const logFilePath = path.join(__dirname, 'transaction_logs.txt');

// 日志记录 API
app.post('/api/logs', (req, res) => {
  const logEntry = `${req.body.timestamp} - ${req.body.type}: ${JSON.stringify(req.body.details)}\n`;

  // 将日志追加到文件中
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write log:', err);
      return res.status(500).json({ message: 'Failed to write log' });
    }
    res.status(200).json({ message: 'Log saved successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
