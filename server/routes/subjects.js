const router = require('express').Router();
const Subject = require('../models/Subject');

router.get('/', async (req, res) => { try { const filter = {}; if (req.query.department) filter.department = req.query.department; const items = await Subject.find(filter).sort({ createdAt: -1 }); res.json(items); } catch (e) { res.status(500).json({ error: e.message }); } });

router.get('/:id', async (req, res) => { try { const it = await Subject.findById(req.params.id); if (!it) return res.status(404).json({ error: 'Not found' }); res.json(it); } catch (e) { res.status(500).json({ error: e.message }); } });

router.post('/', async (req, res) => { try { const created = await Subject.create(req.body); res.status(201).json(created); } catch (e) { res.status(400).json({ error: e.message }); } });

router.put('/:id', async (req, res) => { try { const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!updated) return res.status(404).json({ error: 'Not found' }); res.json(updated); } catch (e) { res.status(400).json({ error: e.message }); } });

router.delete('/:id', async (req, res) => { try { await Subject.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

module.exports = router;
