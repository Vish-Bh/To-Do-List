const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/User', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: {
    type: [
      new mongoose.Schema({
        title: { type: String, required: true },
        description: { type: String, required: true },
        dateCreate: { type: Date, default: Date.now },
        deadline: { type: Date },
        completed: { type: Boolean, default: false }
      }, { _id: false })
    ],
    default: []
  }
});

const User = mongoose.model('User', userSchema,'Names');

app.get('/start', async (req, res)=>{
  const num =  await User.countDocuments()
  if (num <= 0){
    res.send(true)
  }else{
    res.send(false)
  }
})

app.get('/tasks/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ name: username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.title);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find();

    const userTasks = users.map(user => ({
      name: user.name,
      tasks: user.title || []
    }));

    res.json(userTasks);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.post('/users', async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'User name is required' });
  }

  try {
    const existingUser = await User.findOne({ name: name.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = new User({ name: name.trim() });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.post('/task', async (req, res) => {
  try {
    const { name, title, description, createDate, deadline, complete } = req.body;

    let user = await User.findOne({ name });

    if (!user) {
      user = new User({
        name,
        title: []
      });

      await user.save();
      console.log(`New user created: ${name}`);
    }

    if (!user.title) {
      user.title = [];
    }

    const taskExists = user.title.some(task => task.title === title);

    if (taskExists) {
      return res.status(400).json({ message: 'A task with this title already exists' });
    }

    user.title.push({
      title: title,
      description: description,
      dateCreate: new Date(createDate),
      deadline: deadline ? new Date(deadline) : null,
      completed: complete,
    });

    await user.save();

    res.status(201).json({ message: 'Task added successfully', task: user.title[user.title.length - 1] });

  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Error adding task' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
