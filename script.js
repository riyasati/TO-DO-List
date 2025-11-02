// Simple Todo List Application
// Task management functionality

// Task data structure and core functions

/**
 * Task class representing a single todo item
 */
class Task {
    constructor(text) {
        this.id = this.generateId();
        this.text = text;
        this.completed = false;
        this.createdAt = new Date().toISOString();
    }

    /**
     * Generate a unique ID for the task
     * @returns {string} Unique identifier
     */
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Task Manager - handles all task operations
 */
class TaskManager {
    constructor() {
        this.tasks = [];
    }

    /**
     * Add a new task to the list
     * @param {string} text - The task text
     * @returns {Task} The created task
     */
    addTask(text) {
        if (!text || text.trim() === '') {
            return null;
        }
        
        const task = new Task(text.trim());
        this.tasks.push(task);
        return task;
    }

    /**
     * Toggle the completion status of a task
     * @param {string} taskId - The ID of the task to toggle
     * @returns {Task|null} The updated task or null if not found
     */
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            return task;
        }
        return null;
    }

    /**
     * Delete a task from the list
     * @param {string} taskId - The ID of the task to delete
     * @returns {boolean} True if task was deleted, false if not found
     */
    deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Get all tasks
     * @returns {Task[]} Array of all tasks
     */
    getAllTasks() {
        return [...this.tasks];
    }

    /**
     * Get a task by ID
     * @param {string} taskId - The ID of the task
     * @returns {Task|null} The task or null if not found
     */
    getTaskById(taskId) {
        return this.tasks.find(t => t.id === taskId) || null;
    }

    /**
     * Clear all tasks
     */
    clearAllTasks() {
        this.tasks = [];
    }
}

// Initialize the task manager
const taskManager = new TaskManager();
// DOM m
anipulation and rendering functions

/**
 * DOM Manager - handles all DOM operations and rendering
 */
class DOMManager {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.taskListElement = document.getElementById('taskList');
        this.emptyStateElement = document.getElementById('emptyState');
        
        // Cache DOM elements for better performance
        this.elements = {
            taskList: this.taskListElement,
            emptyState: this.emptyStateElement
        };
    }

    /**
     * Render all tasks to the DOM
     */
    renderTasks() {
        const tasks = this.taskManager.getAllTasks();
        
        // Clear existing tasks
        this.elements.taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        
        // Render each task
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.elements.taskList.appendChild(taskElement);
        });
    }

    /**
     * Create a DOM element for a single task
     * @param {Task} task - The task object
     * @returns {HTMLElement} The task DOM element
     */
    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'task-item--completed' : ''}`;
        taskItem.setAttribute('data-task-id', task.id);
        taskItem.setAttribute('role', 'listitem');
        
        taskItem.innerHTML = `
            <div class="task-item__content" role="button" tabindex="0" aria-label="Toggle task completion">
                <div class="task-item__checkbox ${task.completed ? 'task-item__checkbox--checked' : ''}">
                    <svg class="task-item__check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                </div>
                <span class="task-item__text">${this.escapeHtml(task.text)}</span>
            </div>
            <button class="task-item__delete" aria-label="Delete task" type="button">
                <svg class="task-item__delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                </polyline>
                </svg>
            </button>
        `;
        
        // Add event listeners
        this.attachTaskEventListeners(taskItem, task.id);
        
        return taskItem;
    }

    /**
     * Attach event listeners to a task element
     * @param {HTMLElement} taskElement - The task DOM element
     * @param {string} taskId - The task ID
     */
    attachTaskEventListeners(taskElement, taskId) {
        const contentElement = taskElement.querySelector('.task-item__content');
        const deleteButton = taskElement.querySelector('.task-item__delete');
        
        // Toggle completion on click or Enter/Space key
        const toggleHandler = (event) => {
            if (event.type === 'click' || 
                (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' '))) {
                event.preventDefault();
                this.handleTaskToggle(taskId);
            }
        };
        
        contentElement.addEventListener('click', toggleHandler);
        contentElement.addEventListener('keydown', toggleHandler);
        
        // Delete task on button click
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.handleTaskDelete(taskId);
        });
    }

    /**
     * Handle task completion toggle
     * @param {string} taskId - The task ID
     */
    handleTaskToggle(taskId) {
        const updatedTask = this.taskManager.toggleTask(taskId);
        if (updatedTask) {
            this.renderTasks();
        }
    }

    /**
     * Handle task deletion
     * @param {string} taskId - The task ID
     */
    handleTaskDelete(taskId) {
        const deleted = this.taskManager.deleteTask(taskId);
        if (deleted) {
            this.renderTasks();
        }
    }

    /**
     * Show the empty state message
     */
    showEmptyState() {
        this.elements.emptyState.style.display = 'block';
        this.elements.emptyState.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hide the empty state message
     */
    hideEmptyState() {
        this.elements.emptyState.style.display = 'none';
        this.elements.emptyState.setAttribute('aria-hidden', 'true');
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - The text to escape
     * @returns {string} The escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the DOM manager
const domManager = new DOMManager(taskManager);/
/ Input handling and task creation

/**
 * Input Manager - handles form submission and input validation
 */
class InputManager {
    constructor(taskManager, domManager) {
        this.taskManager = taskManager;
        this.domManager = domManager;
        
        // Cache DOM elements
        this.elements = {
            form: document.getElementById('taskForm'),
            input: document.getElementById('taskInput')
        };
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for form and input
     */
    initializeEventListeners() {
        // Handle form submission (Enter key and button click)
        this.elements.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleTaskSubmission();
        });

        // Handle input validation on input event
        this.elements.input.addEventListener('input', (event) => {
            this.validateInput(event.target.value);
        });

        // Handle paste events for validation
        this.elements.input.addEventListener('paste', (event) => {
            // Use setTimeout to get the value after paste
            setTimeout(() => {
                this.validateInput(this.elements.input.value);
            }, 0);
        });
    }

    /**
     * Handle task submission from form
     */
    handleTaskSubmission() {
        const inputValue = this.elements.input.value;
        
        // Validate input before creating task
        if (!this.isValidInput(inputValue)) {
            this.showInputError('Please enter a valid task');
            return;
        }

        // Create the task
        const newTask = this.taskManager.addTask(inputValue);
        
        if (newTask) {
            // Clear the input field
            this.clearInput();
            
            // Remove any error states
            this.clearInputError();
            
            // Re-render the task list
            this.domManager.renderTasks();
            
            // Focus back on input for better UX
            this.elements.input.focus();
        } else {
            this.showInputError('Failed to create task');
        }
    }

    /**
     * Validate input value
     * @param {string} value - The input value to validate
     * @returns {boolean} True if valid, false otherwise
     */
    isValidInput(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }
        
        const trimmedValue = value.trim();
        
        // Check if empty
        if (trimmedValue === '') {
            return false;
        }
        
        // Check length (maxlength is handled by HTML attribute, but double-check)
        if (trimmedValue.length > 500) {
            return false;
        }
        
        return true;
    }

    /**
     * Validate input and provide visual feedback
     * @param {string} value - The input value
     */
    validateInput(value) {
        if (value.length > 0 && !this.isValidInput(value)) {
            if (value.trim() === '') {
                this.showInputError('Task cannot be empty');
            } else if (value.length > 500) {
                this.showInputError('Task is too long (max 500 characters)');
            }
        } else {
            this.clearInputError();
        }
    }

    /**
     * Show input error message
     * @param {string} message - The error message to display
     */
    showInputError(message) {
        // Remove existing error if any
        this.clearInputError();
        
        // Add error class to input
        this.elements.input.classList.add('task-input--error');
        this.elements.input.setAttribute('aria-invalid', 'true');
        
        // Create and show error message
        const errorElement = document.createElement('div');
        errorElement.className = 'input-error';
        errorElement.id = 'inputError';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'polite');
        
        // Insert error message after the input group
        const inputGroup = this.elements.input.closest('.input-group');
        inputGroup.parentNode.insertBefore(errorElement, inputGroup.nextSibling);
        
        // Update aria-describedby to include error
        const currentDescribedBy = this.elements.input.getAttribute('aria-describedby') || '';
        this.elements.input.setAttribute('aria-describedby', `${currentDescribedBy} inputError`.trim());
    }

    /**
     * Clear input error state and message
     */
    clearInputError() {
        // Remove error class from input
        this.elements.input.classList.remove('task-input--error');
        this.elements.input.setAttribute('aria-invalid', 'false');
        
        // Remove error message if it exists
        const existingError = document.getElementById('inputError');
        if (existingError) {
            existingError.remove();
        }
        
        // Reset aria-describedby
        this.elements.input.setAttribute('aria-describedby', 'taskInputHelp');
    }

    /**
     * Clear the input field
     */
    clearInput() {
        this.elements.input.value = '';
        this.clearInputError();
    }

    /**
     * Get the current input value
     * @returns {string} The current input value
     */
    getInputValue() {
        return this.elements.input.value;
    }

    /**
     * Set focus on the input field
     */
    focusInput() {
        this.elements.input.focus();
    }
}

// Application initialization
/**
 * Initialize the todo application
 */
function initializeApp() {
    // Initialize managers
    const inputManager = new InputManager(taskManager, domManager);
    
    // Initial render
    domManager.renderTasks();
    
    // Focus on input for better UX
    inputManager.focusInput();
    
    console.log('Simple Todo List application initialized successfully');
}

// Initialize the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}