const express = require('express');
const { getSupabase } = require('../lib/supabaseServer');

const router = express.Router();

/** Maps API type segment → Supabase table name */
const TYPE_TABLE = {
  bed: 'beds',
  accessory: 'accessories',
  furniture: 'furniture',
  sofacumbed: 'sofacumbed',
};

router.get('/:type/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const type = String(req.params.type || '').toLowerCase();
    const id = req.params.id;
    const table = TYPE_TABLE[type];

    if (!table) {
      return res.status(400).json({ error: 'Invalid product type' });
    }

    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();

    if (error) {
      console.error('catalog fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    if (!data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ ...data, type });
  } catch (err) {
    if (err.code === 'SUPABASE_CONFIG') {
      return res.status(503).json({ error: err.message });
    }
    console.error('catalog route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
