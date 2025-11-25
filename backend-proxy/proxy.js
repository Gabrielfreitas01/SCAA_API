const axios = require('axios');

async function forward(req, body, user) {
  try {
    const resp = await axios({
      method: req.method,
      url: `${process.env.BACKEND_BASE_URL}${req.originalUrl}`,
      data: body
    });
    return { status: resp.status, body: resp.data };
  } catch (err) {
    return { status: err.response?.status || 500, body: { error: err.message } };
  }
}

module.exports = { forward };
