const currentDate = new Date();
const formattedDate = currentDate.getFullYear() + '-' +
(currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
currentDate.getDate().toString().padStart(2, '0');

function clearDetails(){
    const taskInput = document.getElementById("todoInput");
    const deadlineInput = document.getElementById("deadlineInput");
    const completeCheckbox = document.getElementById("completeCheckbox");
    const descriptionInput = document.getElementById("descriptionInput");
    taskInput.value=""
    deadlineInput.value=""
    completeCheckbox.checked=false
    descriptionInput.value=""
}
async function loadTasksForUser(username) {
    try {
        const response = await fetch(`http://localhost:3000/tasks/${encodeURIComponent(username)}`);

        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }

        const tasks = await response.json();

        const todoList = document.getElementById("todoList");
        todoList.innerHTML = '';

        tasks.forEach(task => {
            const li = document.createElement("li");
            li.innerHTML = `
            <strong>${task.title}</strong><br />
            <small>Date Created: ${new Date(task.dateCreate).toLocaleDateString()}</small><br />
            <small>Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</small><br />
            <small>Status: ${task.complete ? '✔️ Completed' : '❌ Not completed'}</small><br/>
            <small>Description: ${task.description || 'No description'}</small>
          `;
            li.setAttribute('id', task._id)
            todoList.appendChild(li);
        });

    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function fetchUserNames() {
    try {
        clearDetails()

        const response = await fetch('http://localhost:3000/users');
        const users = await response.json();
        const userSelect = document.getElementById("userSelect");

        userSelect.innerHTML = '';

        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.name;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });

        const newOption = document.createElement("option");
        newOption.value = 'new';
        newOption.textContent = 'Create a new user';
        userSelect.appendChild(newOption);

        if (users.length > 0) {
            const firstUser = users[0].name;
            userSelect.value = firstUser;
            document.getElementById("username").textContent = firstUser;

            loadTasksForUser(firstUser);
        }

    } catch (error) {
        console.error('Error fetching user names:', error);
    }
}

async function promptForNewUser() {
    clearDetails()

    let newUser = null;
    const userResponse = await fetch('http://localhost:3000/users');
    const existingUsers = await userResponse.json();
    const hasUsers = existingUsers && existingUsers.length > 0;

    const select = document.getElementById('userSelect');

    while (true) {
        newUser = prompt("Enter new user name:");

        if (newUser === null) {
            
            if (hasUsers) {
                
                select.selectedIndex = 0;
                const firstUser = select.options[0]?.value;
                document.getElementById("username").textContent = firstUser;
                loadTasksForUser(firstUser);
                break;
            } else {
                alert("You must enter a username to continue.");
                continue;
            }
        }

        newUser = newUser.trim();
        if (newUser === "") {
            alert("Username cannot be empty");
            continue;
        }

        const response = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newUser.trim() }),
        });

        if (response.ok) {
            const select = document.getElementById('userSelect');
            const option = document.createElement("option");
            option.text = newUser;
            option.value = newUser;
            select.add(option, select.options.length - 1);
            select.value = newUser;
            document.getElementById("username").textContent = newUser;
            loadTasksForUser(newUser);
            break;
        } else {
            const error = await response.json();
            if (error.message === "Username already exists") {
                alert("Username already exists, please choose another.");
            } else {
                alert("Error creating user.");
                break;
            }
        }
    }
}//User

async function handleUserChange() {
    clearDetails()

    const select = document.getElementById("userSelect");
    const selectedValue = select.value;

    if (selectedValue === "new") {
        await promptForNewUser();
    } else {
        document.getElementById("username").textContent = selectedValue;
    }

    loadTasksForUser(select.value);
    document.getElementById("todoList").innerHTML = "";
}

async function addTodo() {

    const User = document.getElementById("userSelect").value;
    const taskInput = document.getElementById("todoInput");
    const deadlineInput = document.getElementById("deadlineInput");
    const completeCheckbox = document.getElementById("completeCheckbox");
    const descriptionInput = document.getElementById("descriptionInput");
    const description = descriptionInput.value.trim();

    const task = taskInput.value.trim();
    const deadline = deadlineInput.value;
    const complete = completeCheckbox.checked;

    if (task === "") {
        alert('Task cannot be empty');
        return;
    }

    const todoList = document.getElementById("todoList");
    const existingTasks = Array.from(todoList.getElementsByTagName("li"));

    const duplicateTask = existingTasks.some(li => {
        return li.querySelector("strong").textContent.trim() === task;
    });

    if (duplicateTask) {
        alert("A task with this title already exists!");
        return;
    }

    const li = document.createElement("li");

    li.innerHTML = `
    <strong>${task}</strong><br />
    <small>Date Created: ${formattedDate}</small><br />
    <small>Deadline: ${deadline ? deadline : 'No deadline'}</small><br />
    <small>Status: ${complete ? '✔️ Completed' : '❌ Not completed'}</small><br/>
    <small>Description: ${description ? description : 'No description'}</small>
  `;
    document.getElementById("todoList").appendChild(li);

    taskInput.value = "";
    descriptionInput.value = "";
    deadlineInput.value = "";

    completeCheckbox.checked = false;

    const response = await fetch('http://localhost:3000/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: User.trim(),
            title: task,
            createDate: formattedDate,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            complete: complete,
            description: description ? description : 'No description'
        })
    });
    if (response.ok) {
        const data = await response.json();

        const taskId = data.taskId;
        li.setAttribute('id', taskId)
    };
}
//1
async function noUser() {
    clearDetails()

    const response = await fetch('http://localhost:3000/users');
    const users = await response.json();
    const userSelect = document.getElementById("userSelect");


    if (!users || users.length === 0) {
        promptForNewUser();

    }
}
function phase1to2() {
    const phase1Items = document.getElementsByClassName('phase1');
    for (let i = 0; i < phase1Items.length; i++) {
        phase1Items[i].style.display = 'none';
    }

    const phase2Items = document.getElementsByClassName('phase2');
    for (let i = 0; i < phase2Items.length; i++) {
        phase2Items[i].style.display = 'inline-block';
    }
}
function phase2to1() {
    const phase1Items = document.getElementsByClassName('phase1');
    for (let i = 0; i < phase1Items.length; i++) {
        phase1Items[i].style.display = 'inline-block';
    }

    const phase2Items = document.getElementsByClassName('phase2');
    for (let i = 0; i < phase2Items.length; i++) {
        phase2Items[i].style.display = 'none';
    }
}
async function loadDetail(taskId) {
    clearDetails()

    const response = await fetch(`http://localhost:3000/task/${taskId}`);
    const task = await response.json();
    document.getElementById('todoInput').value = task.title
    document.getElementById('descriptionInput').value = task.description
    const deadline = task.deadline;
    if (deadline) {
        const formattedDate = new Date(deadline).toISOString().split('T')[0];
        document.getElementById('deadlineInput').value = formattedDate;
    } else {
        document.getElementById('deadlineInput').value = '';
    }
    document.getElementById('completeCheckbox').checked = task.complete
    document.getElementById("currentTaskId").textContent = task._id
    phase1to2()
}

async function submitUpdate() {

    const taskId = document.getElementById('currentTaskId').textContent
    const User = document.getElementById("userSelect").value;
    const taskInput = document.getElementById("todoInput");
    const deadlineInput = document.getElementById("deadlineInput");
    const completeCheckbox = document.getElementById("completeCheckbox");
    const descriptionInput = document.getElementById("descriptionInput");
    const description = descriptionInput.value.trim();

    const task = taskInput.value.trim();
    const deadline = deadlineInput.value;
    const complete = completeCheckbox.checked;
    const response = await fetch('http://localhost:3000/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id:taskId ,
            name: User.trim(),
            title: task,
            createDate: formattedDate,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            complete: complete,
            description: description ? description : 'No description'
        })}
    )
    loadTasksForUser(User)
    phase2to1()
    clearDetails()
}

function submitDelete() {
    const selectedUser= document.getElementById("userSelect").value;
    const selectedTaskId = document.getElementById('currentTaskId').textContent

    fetch('http://localhost:3000/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: selectedUser,
        taskId: selectedTaskId
      })
    })
    .then(res => res.json())
    .then(data => {
    
      loadTasksForUser(selectedUser)
      phase2to1()
      clearDetails()
    })
    .catch(err => console.error("Delete error:", err));
  }
  


window.onload = function () {
    fetchUserNames();
    noUser();
};
const todoList = document.getElementById("todoList");

todoList.addEventListener("click", async function (event) {
    if (event.target.tagName === "LI") {
        const clickedItemId = event.target.id;
        loadDetail(clickedItemId)
        //    const taskId = '681208f83128bad67eae36dd'; // Example task ID
    }
});