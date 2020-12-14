const SAVE_LOCATION = "time-tracker";

const timerButton = document.getElementById("timerToggle");
const timeDisplay = document.getElementById("timeDisplay");

const projectSelector = document.getElementById("projectSelector");
const createProjectButton = document.getElementById("createProject");

let timerId, timeElapsed = 0;

let data = {};
let currentProject = {};

/**
 * Initialize UI components on page load.
 */
(function initUI() {
    // make all the buttons work
    bindButtonActions();

    // load data from localStorage
    data = JSON.parse(localStorage.getItem(SAVE_LOCATION)) || {};

    // create options for the project selector
    populateProjectSelector();

    // record changes to the last opened project of the project selector
    projectSelector.onchange = e => {
        // change the last opened project to the newly selected project
        data.lastOpenProject = e.target.value;

        // get reference to the current project object by name of last open project
        currentProject = data.projects.find(x => x.name == data.lastOpenProject);

        // update the time display
        timeDisplay.innerText = formatTime(currentProject.time);
    }

    // if there is a currentProject, load that time and show it
    if (currentProject)
    {
        // update the time display
        timeDisplay.innerText = formatTime(currentProject.time);
    }
})();

/**
 * Get projects from localStorage, add them to the project selector, and select the
 * last opened project.
 */
function populateProjectSelector() {
    // if there are no projects added yet
    if (!data.hasOwnProperty("projects") || data.projects.length === 0)
    {
        // create an option for the empty message
        const option = document.createElement("option");
        option.text = "No projects added yet";

        // add the project to the selector
        projectSelector.add(option);
    }
    // if there are projects that have been saved
    else
    {
        // add all the projects to the selector
        data.projects
            .forEach(project => {
                // create an option for the project 
                const option = document.createElement("option");
                option.text = project.name;

                // add the project to the selector
                projectSelector.add(option);
            });

        // select the current project on the project selector
        projectSelector.value = data.lastOpenProject;

        // get reference to the current project object by name of last open project
        currentProject = data.projects.find(x => x.name == data.lastOpenProject);
    }
}

/**
 * Create a project and add it to the select.
 */
function createProject() {
    // get the name of the project from hte user
    const projectName = prompt("What is the project called?");

    // get the names of the other projects the user has added
    const existingProjects = [...projectSelector.options]
        .map(option => option.text);

    // if the project name is a duplocate, tell the user
    if (existingProjects.includes(projectName)) 
    {
        alert("A project by that name already exists!");
    }
    // if the project name is unique, create and add to the project selector
    else
    {
        // create an option for the new project 
        const option = document.createElement("option");
        option.text = projectName;

        // add the project to the selector
        projectSelector.add(option);

        // set the selector choice to the new project
        projectSelector.value = projectName;

        // set the last open project to the new project so we can resume if page is reloaded
        data.lastOpenProject = projectName;

        // if this is the first project being added
        if (!data.hasOwnProperty("projects")) 
        {
            // initialize the projects property
            data.projects = [];

            // remove the "No projects added yet" option
            projectSelector.remove(0);
        }

        // add the project to the project array
        data.projects.push({
            name: projectName,
            time: 0
        });

        // get reference to the project, since it was just pushed we know it is the last element
        currentProject = data.projects[data.projects.length - 1];

        // update the time display
        timeDisplay.innerText = formatTime(currentProject.time);

        // save changes to the projects array
        saveData();
    }
}

/**
 * Save the project data to localStorage.
 */
function saveData() {
    localStorage.setItem(SAVE_LOCATION, JSON.stringify(data));
}

/**
 * Bind on click actions to buttons.
 */
function bindButtonActions() {
    // create a new project on click
    createProjectButton.onclick = createProject;

    // start the timer on button click
    timerButton.onclick = () => {
        if (timerButton.innerHTML == "Start Timing")
        {
            // change button text
            timerButton.innerHTML = "Stop Timing";

            startTimer();
        }
        else
        {
            // change button text
            timerButton.innerHTML = "Start Timing";

            // stop the timer
            clearInterval(timerId);
        }
    }
}

/**
 * Start a timer.
 */
function startTimer() {
    // start new timer
    timerId = setInterval(() => {
        // record that a second has passed
        currentProject.time++;

        // update the time display
        timeDisplay.innerText = formatTime(currentProject.time);

        // save updated times to localStorage
        saveData();
    }, 1000);
}

/**
 * Turn milliseconds into a human readable HH:MM:SS time format.
 * @param {Number} time 
 */
function formatTime(time) {
    // calculate hours
    let hours = Math.floor(time / 3600);
    time = time - hours * 3600;

    // calculate minutes and seconds left over from hours
    let minutes = Math.floor(time / 60);
    let seconds = time - minutes * 60;

    return `${left_pad(hours, "0", 2)}:${left_pad(minutes, "0", 2)}:${left_pad(seconds, "0", 2)}`;
}

/**
 * https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
 * @param {String} string 
 * @param {String} pad 
 * @param {Number} length 
 * @return {String} paddedString
 */
function left_pad(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
}