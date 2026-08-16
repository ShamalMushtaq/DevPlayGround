const htmlEditor = document.getElementById('htmlEditor');
const cssEditor = document.getElementById('cssEditor');
const jsEditor = document.getElementById('jsEditor');
const outputPreview = document.getElementById('outputPreview');
const runBtn = document.getElementById('runBtn');
const themeToggle = document.getElementById('themeToggle');
const clearStorageBtn = document.getElementById('clearStorageBtn');

// Modals & Buttons
const saveBtn = document.getElementById('saveBtn');
const saveModal = document.getElementById('saveModal');
const closeSaveModal = document.getElementById('closeSaveModal');
const cancelSaveBtn = document.getElementById('cancelSaveBtn');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');
const projectNameInput = document.getElementById('projectNameInput');

const viewSavedBtn = document.getElementById('viewSavedBtn');
const savedModal = document.getElementById('savedModal');
const closeModal = document.getElementById('closeModal');
const savedProjectsList = document.getElementById('savedProjectsList');

const shareBtn = document.getElementById('shareBtn');
const toast = document.getElementById('toast');
const tabBtns = document.querySelectorAll('.tab-btn');
const codeInputs = document.querySelectorAll('.code-input');

// Variable to track currently loaded project ID for updating existing projects
let currentProjectId = null;

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        codeInputs.forEach(input => input.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});

// Update Preview
function updatePreview() {
    const htmlValue = htmlEditor.value;
    const cssValue = cssEditor.value;
    const jsValue = jsEditor.value;

    const iframeDoc = outputPreview.contentDocument || outputPreview.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
        <!DOCTYPE html><html><head><style>${cssValue}</style></head>
        <body>${htmlValue}<script>${jsValue}<\/script></body></html>
    `);
    iframeDoc.close();
}

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

// Clear Button
clearStorageBtn.addEventListener('click', () => {
    htmlEditor.value = '';
    cssEditor.value = '';
    jsEditor.value = '';
    currentProjectId = null; // Reset loaded project ID on clear
    updatePreview();
});

// Open Save Modal Box
saveBtn.addEventListener('click', () => {
    if (!currentProjectId) {
        projectNameInput.value = '';
    }
    saveModal.classList.add('active');
    projectNameInput.focus();
});

closeSaveModal.addEventListener('click', () => saveModal.classList.remove('active'));
cancelSaveBtn.addEventListener('click', () => saveModal.classList.remove('active'));

// Confirm Save Action (Handles both new creation and updating existing loaded project)
confirmSaveBtn.addEventListener('click', () => {
    const projectName = projectNameInput.value.trim();
    if (!projectName) {
        alert('Please enter a project name!');
        return;
    }

    let projects = JSON.parse(localStorage.getItem('dev_projects') || '[]');

    if (currentProjectId) {
        // Update existing project if it was loaded
        const index = projects.findIndex(p => p.id === currentProjectId);
        if (index !== -1) {
            projects[index].name = projectName;
            projects[index].html = htmlEditor.value;
            projects[index].css = cssEditor.value;
            projects[index].js = jsEditor.value;
            projects[index].date = new Date().toLocaleDateString();
        }
    } else {
        // Create new project entry
        const newProject = {
            id: Date.now(),
            name: projectName,
            html: htmlEditor.value,
            css: cssEditor.value,
            js: jsEditor.value,
            date: new Date().toLocaleDateString()
        };
        projects.push(newProject);
        currentProjectId = newProject.id; // Set ID so subsequent saves update this project
    }

    localStorage.setItem('dev_projects', JSON.stringify(projects));
    
    saveModal.classList.remove('active');
    showToast('Project saved successfully! 💾');
});

// View Saved Projects Modal
viewSavedBtn.addEventListener('click', () => {
    renderSavedProjects();
    savedModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
    savedModal.classList.remove('active');
});

// Render Projects Inside Modal
function renderSavedProjects() {
    const projects = JSON.parse(localStorage.getItem('dev_projects') || '[]');
    savedProjectsList.innerHTML = '';

    if (projects.length === 0) {
        savedProjectsList.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 20px 0;">No saved projects found.</p>`;
        return;
    }

    projects.forEach(proj => {
        const item = document.createElement('div');
        item.className = 'saved-item';
        item.innerHTML = `
            <div class="saved-item-info">
                <span>${proj.name}</span>
                <small>Saved on: ${proj.date}</small>
            </div>
            <div class="saved-item-actions">
                <button class="btn-load" onclick="loadProject(${proj.id})">Load</button>
                <button class="btn-delete" onclick="deleteProject(${proj.id})">Delete</button>
            </div>
        `;
        savedProjectsList.appendChild(item);
    });
}

// Load Specific Project
window.loadProject = function(id) {
    const projects = JSON.parse(localStorage.getItem('dev_projects') || '[]');
    const proj = projects.find(p => p.id === id);
    
    if (proj) {
        currentProjectId = proj.id; // Track loaded project ID for updating
        htmlEditor.value = proj.html;
        cssEditor.value = proj.css;
        jsEditor.value = proj.js;
        projectNameInput.value = proj.name;
        
        updatePreview();
        savedModal.classList.remove('active');
        showToast(`Loaded "${proj.name}" successfully! 🚀`);
    }
}

// Delete Specific Project
window.deleteProject = function(id) {
    let projects = JSON.parse(localStorage.getItem('dev_projects') || '[]');
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('dev_projects', JSON.stringify(projects));
    
    // If the currently active project was deleted, reset the ID tracker
    if (currentProjectId === id) {
        currentProjectId = null;
        projectNameInput.value = '';
    }
    
    renderSavedProjects();
    showToast('Project deleted successfully! 🗑️');
}

// Share URL Generation
shareBtn.addEventListener('click', () => {
    const data = {
        h: encodeURIComponent(htmlEditor.value),
        c: encodeURIComponent(cssEditor.value),
        j: encodeURIComponent(jsEditor.value)
    };
    const jsonString = JSON.stringify(data);
    const base64Code = btoa(jsonString);
    const shareUrl = `${window.location.origin}${window.location.pathname}#${base64Code}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Shareable link copied to clipboard! 🔗');
    });
});

// Toast Notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Startup: Check shared hash or load blank
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash) {
        try {
            const base64Code = window.location.hash.substring(1);
            const jsonString = atob(base64Code);
            const data = JSON.parse(jsonString);
            
            htmlEditor.value = decodeURIComponent(data.h || '');
            cssEditor.value = decodeURIComponent(data.c || '');
            jsEditor.value = decodeURIComponent(data.j || '');
        } catch (e) {
            console.error('Invalid share link');
        }
    }
    updatePreview();
});

runBtn.addEventListener('click', updatePreview);