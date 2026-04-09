const router = require('express').Router();
const { Skill, Goal, Roadmap } = require('../models/SkillsModels');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);

// ── SKILLS ──
router.get('/skills',       async(req,res)=>{ try{ res.json(await Skill.find({user:req.session.userId}).sort({createdAt:-1})); }catch(e){res.status(500).json({error:e.message});} });
router.post('/skills',      async(req,res)=>{ try{ res.json(await Skill.create({user:req.session.userId,...req.body})); }catch(e){res.status(400).json({error:e.message});} });
router.put('/skills/:id',   async(req,res)=>{ try{ res.json(await Skill.findOneAndUpdate({_id:req.params.id,user:req.session.userId},req.body,{new:true})); }catch(e){res.status(400).json({error:e.message});} });
router.delete('/skills/:id',async(req,res)=>{ try{ await Skill.findOneAndDelete({_id:req.params.id,user:req.session.userId}); res.json({message:'Deleted'}); }catch(e){res.status(500).json({error:e.message});} });

// ── GOALS ──
router.get('/goals',        async(req,res)=>{ try{ res.json(await Goal.find({user:req.session.userId}).sort({createdAt:-1})); }catch(e){res.status(500).json({error:e.message});} });
router.post('/goals',       async(req,res)=>{ try{ res.json(await Goal.create({user:req.session.userId,...req.body})); }catch(e){res.status(400).json({error:e.message});} });
router.put('/goals/:id',    async(req,res)=>{ try{ res.json(await Goal.findOneAndUpdate({_id:req.params.id,user:req.session.userId},req.body,{new:true})); }catch(e){res.status(400).json({error:e.message});} });
router.delete('/goals/:id', async(req,res)=>{ try{ await Goal.findOneAndDelete({_id:req.params.id,user:req.session.userId}); res.json({message:'Deleted'}); }catch(e){res.status(500).json({error:e.message});} });

// ── ROADMAPS ──
router.get('/roadmaps',         async(req,res)=>{ try{ res.json(await Roadmap.find({user:req.session.userId}).sort({createdAt:-1})); }catch(e){res.status(500).json({error:e.message});} });
router.post('/roadmaps',        async(req,res)=>{ try{ res.json(await Roadmap.create({user:req.session.userId,...req.body})); }catch(e){res.status(400).json({error:e.message});} });
router.put('/roadmaps/:id',     async(req,res)=>{ try{ res.json(await Roadmap.findOneAndUpdate({_id:req.params.id,user:req.session.userId},req.body,{new:true})); }catch(e){res.status(400).json({error:e.message});} });
router.delete('/roadmaps/:id',  async(req,res)=>{ try{ await Roadmap.findOneAndDelete({_id:req.params.id,user:req.session.userId}); res.json({message:'Deleted'}); }catch(e){res.status(500).json({error:e.message});} });

module.exports = router;