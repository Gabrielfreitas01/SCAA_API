function handleFailure(req, res, error) {
  return res.status(503).json({ error: 'SCAA Failure', details: error.message });
}

module.exports = { handleFailure };
