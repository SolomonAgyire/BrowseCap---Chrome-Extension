let mySites = []
const inputEl = document.getElementById("input-el")
const inputBtn = document.getElementById("input-btn")
const ulEl = document.getElementById("ul-el")
const deleteBtn = document.getElementById("delete-btn")
const tabBtn = document.getElementById("tab-btn")
const searchEl = document.getElementById("search-el")
const categorySelect = document.getElementById("category-select")
const addCategoryBtn = document.getElementById("add-category-btn")
const sortAlphaBtn = document.getElementById("sort-alpha")
const sortDateBtn = document.getElementById("sort-date")

// Initialize categories
let categories = JSON.parse(localStorage.getItem("categories")) || {"General": []};

// Load saved sites with enhanced structure
const sitesFromLocalStorage = JSON.parse(localStorage.getItem("mySites"))
if (sitesFromLocalStorage) {
    mySites = sitesFromLocalStorage.map(site => {
        // Convert old format to new format if necessary
        return typeof site === 'string' ? {
            url: site,
            tags: [],
            note: '',
            timestamp: new Date().toISOString(),
            category: 'General'
        } : site;
    })
    render(mySites)
}

// Initialize categories dropdown
function updateCategorySelect() {
    categorySelect.innerHTML = Object.keys(categories).map(category => 
        `<option value="${category}">${category}</option>`
    ).join('');
}
updateCategorySelect();

// Add category functionality
addCategoryBtn.addEventListener("click", function() {
    const newCategory = prompt("Enter new category name:");
    if (newCategory && !categories[newCategory]) {
        categories[newCategory] = [];
        saveCategories();
        updateCategorySelect();
    }
});

// Search functionality
searchEl.addEventListener("input", function(e) {
    const query = e.target.value.toLowerCase();
    const filteredSites = mySites.filter(site => 
        site.url.toLowerCase().includes(query) || 
        site.note.toLowerCase().includes(query) ||
        site.tags.some(tag => tag.toLowerCase().includes(query))
    );
    render(filteredSites);
});

// Sorting functionality
sortAlphaBtn.addEventListener("click", () => sortSites('alpha'));
sortDateBtn.addEventListener("click", () => sortSites('date'));

function sortSites(method) {
    switch(method) {
        case 'alpha':
            mySites.sort((a, b) => a.url.localeCompare(b.url));
            break;
        case 'date':
            mySites.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
    }
    render(mySites);
}

// Save tab functionality
tabBtn.addEventListener("click", function(){    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        const newSite = {
            url: tabs[0].url,
            tags: [],
            note: '',
            timestamp: new Date().toISOString(),
            category: categorySelect.value
        };
        mySites.push(newSite);
        localStorage.setItem("mySites", JSON.stringify(mySites));
        render(mySites);
    })
})

// Enhanced render function
function render(sites) {
    if (sites.length === 0) {
        ulEl.innerHTML = `
            <div class="lead-item" style="text-align: center; color: #666;">
                No saved sites yet. Start by saving some URLs!
            </div>
        `;
        return;
    }
    let listItems = "";
    for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        listItems += `
            <li>
                <div class="site-item">
                    <a target='_blank' href='${site.url}'>
                        ${site.url}
                    </a>
                    <div class="site-controls">
                        <button class="copy-btn" data-index="${i}">Copy URL</button>
                        <button class="note-btn" data-index="${i}">${site.note ? 'Edit Note' : 'Add Note'}</button>
                        <button class="tag-btn" data-index="${i}">Add Tag</button>
                    </div>
                    ${site.note ? `<div class="note">${site.note}</div>` : ''}
                    <div class="tags">
                        ${site.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="metadata">
                        Category: ${site.category} | Added: ${new Date(site.timestamp).toLocaleDateString()}
                    </div>
                </div>
            </li>
        `
    }
    ulEl.innerHTML = listItems;

    // Add event listeners for buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.dataset.index;
            copyToClipboard(sites[index].url, this);
        });
    });

    document.querySelectorAll('.note-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.dataset.index;
            addNote(index);
        });
    });

    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.dataset.index;
            addTag(index);
        });
    });
}

// Helper functions
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text);
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => button.textContent = originalText, 1000);
}

function addNote(index) {
    const note = prompt("Add/Edit note:", mySites[index].note);
    if (note !== null) {
        mySites[index].note = note;
        localStorage.setItem("mySites", JSON.stringify(mySites));
        render(mySites);
    }
}

function addTag(index) {
    const tag = prompt("Add new tag:");
    if (tag && !mySites[index].tags.includes(tag)) {
        mySites[index].tags.push(tag);
        localStorage.setItem("mySites", JSON.stringify(mySites));
        render(mySites);
    }
}

// Delete functionality
deleteBtn.addEventListener("dblclick", function() {
    if (confirm("Are you sure you want to delete all saved sites?")) {
        localStorage.clear();
        mySites = [];
        categories = {"General": []};
        saveCategories();
        updateCategorySelect();
        render(mySites);
    }
});

// Save input functionality
inputBtn.addEventListener("click", function() {
    if (inputEl.value) {
        const newSite = {
            url: inputEl.value,
            tags: [],
            note: '',
            timestamp: new Date().toISOString(),
            category: categorySelect.value
        };
        mySites.push(newSite);
        inputEl.value = "";
        localStorage.setItem("mySites", JSON.stringify(mySites));
        render(mySites);
    }
})

// Update the categories storage handling
function saveCategories() {
    localStorage.setItem("categories", JSON.stringify(categories));
}

// Add category change handling
categorySelect.addEventListener("change", function() {
    const selectedCategory = this.value;
    const filteredSites = mySites.filter(site => site.category === selectedCategory);
    render(selectedCategory === "General" ? mySites : filteredSites);
});