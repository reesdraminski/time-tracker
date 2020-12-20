const SAVE_LOCATION = "time-tracker";

const timerButton = document.getElementById("timerToggle");
const timeDisplay = document.getElementById("timeDisplay");

const projectSelector = document.getElementById("projectSelector");
const createProjectButton = document.getElementById("createProject");
const sessionsEl = document.getElementById("sessions");

let timerId, timeElapsed = 0,
    data = {}, currentProject = {};

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

    // if currentProject is not an empty object (i.e. defined), show the project time
    if (Object.keys(currentProject).length !== 0)
    {
        // update the time display
        timeDisplay.innerText = formatTime(currentProject.time);
    }

    // show the sessions of the currentProject (this was set in the populateProjectSelector function)
    renderSessions();

    // stop a timer before the tab closes
    window.onbeforeunload = stopTimer;
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

    // record changes to the last opened project of the project selector
    projectSelector.onchange = e => handleProjectChange(e);
}

/**
 * Handle changes of project in the projects selector.
 * @param {Event} e 
 */
function handleProjectChange(e) {
    // change the last opened project to the newly selected project
    data.lastOpenProject = e.target.value;

    // save the updated last opened project
    saveData();

    // get reference to the current project object by name of last open project
    currentProject = data.projects.find(x => x.name == data.lastOpenProject);

    // update the time display
    timeDisplay.innerText = formatTime(currentProject.time);

    // show the sessions of the newly selected project
    renderSessions();
}

/**
 * Display all the sessions of a project below the timer.
 */
function renderSessions() {
    // do not try to render sessions if there aren't any
    if (currentProject.sessions.length === 0) return;

    // reset sessions el
    sessionsEl.innerHTML = `<h3>Project Working Time Blocks Report:</h3>`;

    // add sessions list element
    const sessionsListEl = document.createElement("ul");
    sessionsListEl.id = "sessionsList";
    sessionsEl.appendChild(sessionsListEl);

    // add all sessions to the sessions list
    currentProject.sessions
        .forEach(session => {
            const li = document.createElement("li");

            const duration = session.timeAtEnd - session.timeAtStart;

            const startDate = new Date(session.startedAt);
            const endDate = new Date(session.endedAt);

            if (datesAreOnSameDay(startDate, endDate))
            {
                li.innerHTML += `
                    You worked on ${startDate.toLocaleDateString()} from ${getTimeString(startDate)} to ${getTimeString(endDate)} for a total of ${getDurationString(duration)}
                `;
            }
            else
            {
                li.innerHTML += `
                    You worked from ${startDate.toLocaleDateString()} ${getTimeString(new Date(startDate))} to ${endDate.toLocaleDateString()} ${getTimeString(endDate)} for a total of ${getDurationString(duration)}
                `;
            }

            sessionsListEl.appendChild(li);
        });
}

/**
 * Humanize a duration (in seconds) to have words for hours/minutes/seconds after the minute in a natural language
 * sentence.
 * @param {String} duration 
 * @return {String} durationString
 */
function getDurationString(duration) {
    let durationString = "";

    // calculate hours
    let hours = Math.floor(duration / 3600);
    duration = duration - hours * 3600;

    // calculate minutes and seconds left over from hours
    let minutes = Math.floor(duration / 60);
    let seconds = duration - minutes * 60;

    if (hours !== 0) 
    {
        durationString += `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }

    if (minutes !== 0) 
    {
        if (hours !== 0)
        {
            durationString += ` and ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
        }
        else
        {
            durationString += `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
        }
    }

    if (seconds !== 0) 
    {
        if (minutes !== 0 || hours !== 0)
        {
            durationString += ` and ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
        }
        else
        {
            durationString += `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
        }
    }

    // add period to end of string to make it a sentence
    return `${durationString}.`;
}

/**
 * Check to see if two dates are the same day.
 * @param {Date} first 
 * @param {Date} second 
 * @return {Boolean} areOnSameDay
 */
function datesAreOnSameDay(first, second) {
    return first.getFullYear() === second.getFullYear() 
        && first.getMonth() === second.getMonth() 
        && first.getDate() === second.getDate()
}

/**
 * Get a time string in HH:MMa format.
 * @param {Date} date 
 * @return {String} timeString
 */
function getTimeString(date) {
    const hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
    const minutes = addLeftPadding(date.getMinutes(), "0", 2);
    const meridiem = date.getHours() > 12 ? "pm" : "am";

    return `${hours}:${minutes}${meridiem}`;
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
            time: 0,
            sessions: []
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

            stopTimer();
        }
    }
}

/**
 * Start a timer and work session.
 */
function startTimer() {
    // start session by recording time of start and num seconds at start
    currentProject.sessions.push({
        startedAt: new Date().getTime(),
        timeAtStart: currentProject.time
    });

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
 * Stop the timer and record the session.
 */
function stopTimer() {
    // if there is no active timer, do nothing
    if (!timerId) return;

    // stop the timer from ticking
    clearInterval(timerId);
    timerId = null;

    // record time at stop of session
    const stopTime = new Date().getTime();

    // get the last open session (i.e. has not ended yet)
    const openSession = currentProject.sessions.find(session => !session.hasOwnProperty("endedAt"));

    // set the end properties of the session
    openSession.endedAt = stopTime;
    openSession.timeAtEnd = currentProject.time;

    // save the session changes
    saveData();

    // update sessions display
    renderSessions();
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

    return `${addLeftPadding(hours, "0", 2)}:${addLeftPadding(minutes, "0", 2)}:${addLeftPadding(seconds, "0", 2)}`;
}

/**
 * https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
 * @param {String} string 
 * @param {String} pad 
 * @param {Number} length 
 * @return {String} paddedString
 */
function addLeftPadding(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
}