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
  task: {
    type: [
      new mongoose.Schema({
        title: { type: String, required: true },
        description: { type: String, required: true },
        dateCreate: { type: Date, default: Date.now },
        deadline: { type: Date },
        complete: { type: Boolean, default: false }
      })
    ],
    default: []
  }
});

const User = mongoose.model('User', userSchema, 'Names');

app.get('/start', async (req, res) => {
  const num = await User.countDocuments();
  res.send(num <= 0);
});

app.get('/tasks/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.task);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

app.get('/task/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({ "task._id": id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const task = user.task.find(t => t._id.toString() === id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Error fetching task' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    const userTasks = users.map(user => ({
      name: user.name,
      tasks: user.task || []
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
      user = new User({ name, task: [] });
      await user.save();
    }
    if (!user.task) user.task = [];

    const taskExists = user.task.some(t => t.title === title);
    if (taskExists) {
      return res.status(400).json({ message: 'A task with this title already exists' });
    }

    user.task.push({
      title,
      description,
      dateCreate: new Date(createDate),
      deadline: deadline ? new Date(deadline) : null,
      complete
    });

    await user.save();
    const taskWithId = user.task[user.task.length - 1];
    res.status(201).json({ message: 'Task added successfully', taskId: taskWithId._id, task: taskWithId });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Error adding task' });
  }
});

app.post('/update', async (req, res) => {
  try {
    const { id, name, title, description, createDate, deadline, complete } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ message: "User not found" });

    const task = user.task.id(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.title = title;
    task.description = description;
    task.dateCreate = createDate;
    task.deadline = deadline;
    task.complete = complete;

    await user.save();
    res.json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/delete', async (req, res) => {
  try {
    const { name, taskId } = req.body;
    const user = await User.findOneAndUpdate(
      { name },
      { $pull: { task: { _id: taskId } } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User or task not found" });
    res.status(200).json({ message: "Task deleted successfully", user });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error while deleting task" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
