function record(user, req, data) {
  console.log({
    time: new Date().toISOString(),
    user,
    method: req.method,
    url: req.originalUrl,
    ...data
  });
}

module.exports = { record };
