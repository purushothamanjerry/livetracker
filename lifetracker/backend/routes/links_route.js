const router = require('express').Router();
const Link = require('../models/Link');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);

router.get('/', async(req,res)=>{ try{ const l=await Link.find({user:req.session.userId}).sort({createdAt:-1}); res.json(l); }catch(e){res.status(500).json({error:e.message});} });
router.post('/', async(req,res)=>{ try{ const l=await Link.create({user:req.session.userId,...req.body}); res.json(l); }catch(e){res.status(400).json({error:e.message});} });
router.put('/:id', async(req,res)=>{ try{ const l=await Link.findOneAndUpdate({_id:req.params.id,user:req.session.userId},req.body,{new:true}); res.json(l); }catch(e){res.status(400).json({error:e.message});} });
router.delete('/:id', async(req,res)=>{ try{ await Link.findOneAndDelete({_id:req.params.id,user:req.session.userId}); res.json({message:'Deleted'}); }catch(e){res.status(500).json({error:e.message});} });
module.exports = router;
