// api/index.ts
import express from 'express';

import { createUserController } from "../src/modules/user/interfaces/factories/user.factories";
const app = express();

app.use(express.json()); // This is crucial!
app.use(express.urlencoded({ extended: true })); // For form data

const userController = createUserController()

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register' , (req,res) => userController.createUser(req,res)) 

// Local dev listener (ignored on Vercel)
app.listen(4000, () => console.log('Server running on http://localhost:4000'));

export default app;
