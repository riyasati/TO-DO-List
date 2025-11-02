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
 * Task Manager - handles all task operations with storage integration
 */
class TaskManager {
    constructor(storageManager) {
        this.tasks = [];
        this.storageManager = storageManager;
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
        
        // Save to storage after adding
        this.saveToStorage();
        
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
            
            // Save to storage after toggling
            this.saveToStorage();
            
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
            
            // Save to storage after deleting
            this.saveToStorage();
            
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
        
        // Clear storage when clearing all tasks
        this.storageManager.clearTasks();
    }

    /**
     * Save current tasks to storage
     * @returns {boolean} True if save was successful
     */
    saveToStorage() {
        if (!this.storageManager) {
            console.warn('No storage manager available');
            return false;
        }
        
        return this.storageManager.saveTasks(this.tasks);
    }

    /**
     * Load tasks from storage and replace current tasks
     * @returns {boolean} True if load was successful
     */
    loadFromStorage() {
        if (!this.storageManager) {
            console.warn('No storage manager available');
            return false;
        }
        
        const loadedTasks = this.storageManager.loadTasks();
        
        if (loadedTasks !== null) {
            this.tasks = loadedTasks;
            return true;
        }
        
        return false;
    }

    /**
     * Initialize tasks by loading from storage
     * This should be called when the application starts
     * @returns {boolean} True if initialization was successful
     */
    initializeTasks() {
        const loadSuccess = this.loadFromStorage();
        
        if (loadSuccess && this.tasks.length > 0) {
            console.log(`Loaded ${this.tasks.length} tasks from storage`);
            // Show feedback for restored tasks
            setTimeout(() => {
                feedbackManager.showMessage(`Restored ${this.tasks.length} task${this.tasks.length === 1 ? '' : 's'} from previous session`, 'info', 2500);
            }, 500); // Delay to allow UI to initialize
        } else {
            console.log('Starting with empty task list');
            this.tasks = [];
        }
        
        return loadSuccess;
    }

    /**
     * Get storage manager instance
     * @returns {StorageManager} The storage manager
     */
    getStorageManager() {
        return this.storageManager;
    }
}

/**
 * Storage Manager - handles localStorage operations with error handling
 */
class StorageManager {
    constructor() {
        this.storageKey = 'todoTasks';
        this.isStorageAvailable = this.checkStorageAvailability();
    }

    /**
     * Check if localStorage is available and working
     * @returns {boolean} True if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage is not available:', error.message);
            return false;
        }
    }

    /**
     * Save tasks to localStorage
     * @param {Task[]} tasks - Array of tasks to save
     * @returns {boolean} True if save was successful
     */
    saveTasks(tasks) {
        if (!this.isStorageAvailable) {
            console.warn('Cannot save tasks: localStorage is not available');
            return false;
        }

        try {
            const tasksData = JSON.stringify(tasks);
            localStorage.setItem(this.storageKey, tasksData);
            return true;
        } catch (error) {
            console.error('Failed to save tasks to localStorage:', error.message);
            
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded. Consider clearing old data.');
            }
            
            return false;
        }
    }

    /**
     * Load tasks from localStorage
     * @returns {Task[]|null} Array of tasks or null if loading failed
     */
    loadTasks() {
        if (!this.isStorageAvailable) {
            console.warn('Cannot load tasks: localStorage is not available');
            return null;
        }

        try {
            const tasksData = localStorage.getItem(this.storageKey);
            
            if (!tasksData) {
                // No data found, return empty array
                return [];
            }

            const parsedTasks = JSON.parse(tasksData);
            
            // Validate that the parsed data is an array
            if (!Array.isArray(parsedTasks)) {
                console.warn('Invalid tasks data format in localStorage');
                return null;
            }

            // Validate and reconstruct Task objects
            const validTasks = parsedTasks
                .filter(taskData => this.isValidTaskData(taskData))
                .map(taskData => this.reconstructTask(taskData));

            return validTasks;
        } catch (error) {
            console.error('Failed to load tasks from localStorage:', error.message);
            
            // If JSON parsing failed, the data might be corrupted
            if (error instanceof SyntaxError) {
                console.error('localStorage data appears to be corrupted');
                this.clearTasks(); // Clear corrupted data
            }
            
            return null;
        }
    }

    /**
     * Clear all tasks from localStorage
     * @returns {boolean} True if clear was successful
     */
    clearTasks() {
        if (!this.isStorageAvailable) {
            console.warn('Cannot clear tasks: localStorage is not available');
            return false;
        }

        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear tasks from localStorage:', error.message);
            return false;
        }
    }

    /**
     * Validate task data structure
     * @param {Object} taskData - Task data to validate
     * @returns {boolean} True if task data is valid
     */
    isValidTaskData(taskData) {
        return (
            taskData &&
            typeof taskData === 'object' &&
            typeof taskData.id === 'string' &&
            typeof taskData.text === 'string' &&
            typeof taskData.completed === 'boolean' &&
            typeof taskData.createdAt === 'string'
        );
    }

    /**
     * Reconstruct a Task object from stored data
     * @param {Object} taskData - Raw task data from storage
     * @returns {Task} Reconstructed Task object
     */
    reconstructTask(taskData) {
        // Create a new task instance and populate it with stored data
        const task = Object.create(Task.prototype);
        task.id = taskData.id;
        task.text = taskData.text;
        task.completed = taskData.completed;
        task.createdAt = taskData.createdAt;
        return task;
    }

    /**
     * Get storage availability status
     * @returns {boolean} True if storage is available
     */
    isAvailable() {
        return this.isStorageAvailable;
    }

    /**
     * Get storage usage information (if available)
     * @returns {Object|null} Storage usage info or null if not available
     */
    getStorageInfo() {
        if (!this.isStorageAvailable) {
            return null;
        }

        try {
            const tasksData = localStorage.getItem(this.storageKey);
            const dataSize = tasksData ? new Blob([tasksData]).size : 0;
            
            return {
                hasData: !!tasksData,
                dataSize: dataSize,
                dataSizeFormatted: this.formatBytes(dataSize)
            };
        } catch (error) {
            console.error('Failed to get storage info:', error.message);
            return null;
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the storage manager
const storageManager = new StorageManager();

// Initialize the task manager with storage
const taskManager = new TaskManager(storageManager);
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
            emptyState: this.emptyStateElement,
            taskSummary: document.getElementById('taskSummary'),
            completedCount: document.getElementById('completedCount'),
            totalCount: document.getElementById('totalCount')
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
            this.hideTaskSummary();
            return;
        }
        
        this.hideEmptyState();
        this.showTaskSummary();
        this.updateTaskSummary();
        
        // Render each task with staggered animation
        tasks.forEach((task, index) => {
            const taskElement = this.createTaskElement(task);
            this.elements.taskList.appendChild(taskElement);
            
            // Add entrance animation with slight delay for staggered effect
            setTimeout(() => {
                taskElement.classList.add('task-entering');
            }, index * 50);
        });
    }

    /**
     * Add a single task with animation
     * @param {Task} task - The task to add
     */
    addTaskWithAnimation(task) {
        const taskElement = this.createTaskElement(task);
        
        // Add to DOM first
        this.elements.taskList.appendChild(taskElement);
        
        // Hide empty state if showing and show summary
        this.hideEmptyState();
        this.showTaskSummary();
        this.updateTaskSummary();
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            taskElement.classList.add('task-entering');
        });
        
        return taskElement;
    }

    /**
     * Remove a task with animation
     * @param {string} taskId - The task ID to remove
     */
    removeTaskWithAnimation(taskId) {
        const taskElement = this.elements.taskList.querySelector(`[data-task-id="${taskId}"]`);
        
        if (taskElement) {
            taskElement.classList.add('task-removing');
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                if (taskElement.parentNode) {
                    taskElement.parentNode.removeChild(taskElement);
                }
                
                // Show empty state if no tasks left
                const remainingTasks = this.taskManager.getAllTasks();
                if (remainingTasks.length === 0) {
                    this.showEmptyState();
                    this.hideTaskSummary();
                } else {
                    this.updateTaskSummary();
                }
            }, 200); // Match animation duration
        }
    }

    /**
     * Create a DOM element for a single task
     * @param {Task} task - The task object
     * @returns {HTMLElement} The task DOM element
     */
    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.setAttribute('data-task-id', task.id);
        taskItem.setAttribute('role', 'listitem');
        
        taskItem.innerHTML = `
            <div class="task-checkbox" role="button" tabindex="0" aria-label="Toggle task completion">
            </div>
            <span class="task-text">${this.escapeHtml(task.text)}</span>
            <button class="delete-button" aria-label="Delete task" type="button">
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
        const checkboxElement = taskElement.querySelector('.task-checkbox');
        const textElement = taskElement.querySelector('.task-text');
        const deleteButton = taskElement.querySelector('.delete-button');
        
        // Toggle completion on click or Enter/Space key
        const toggleHandler = (event) => {
            if (event.type === 'click' || 
                (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' '))) {
                event.preventDefault();
                this.handleTaskToggle(taskId);
            }
        };
        
        // Add toggle handlers to both checkbox and text
        checkboxElement.addEventListener('click', toggleHandler);
        checkboxElement.addEventListener('keydown', toggleHandler);
        textElement.addEventListener('click', toggleHandler);
        
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
        const taskElement = this.elements.taskList.querySelector(`[data-task-id="${taskId}"]`);
        const updatedTask = this.taskManager.toggleTask(taskId);
        
        if (updatedTask && taskElement) {
            // Add animation class based on completion state
            const animationClass = updatedTask.completed ? 'task-completing' : 'task-uncompleting';
            taskElement.classList.add(animationClass);
            
            // Update the task element state
            if (updatedTask.completed) {
                taskElement.classList.add('completed');
                feedbackManager.showMessage('Task completed! 🎉', 'success', 1500);
            } else {
                taskElement.classList.remove('completed');
                feedbackManager.showMessage('Task marked as incomplete', 'info', 1500);
            }
            
            // Remove animation class after animation completes
            setTimeout(() => {
                taskElement.classList.remove(animationClass);
            }, 300); // Match animation duration
            
            // Update task summary
            this.updateTaskSummary();
        }
    }

    /**
     * Handle task deletion
     * @param {string} taskId - The task ID
     */
    handleTaskDelete(taskId) {
        // Remove with animation first
        this.removeTaskWithAnimation(taskId);
        
        // Show feedback
        feedbackManager.showMessage('Task deleted', 'info', 1500);
        
        // Then delete from data (after a short delay to allow animation to start)
        setTimeout(() => {
            this.taskManager.deleteTask(taskId);
        }, 50);
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
     * Show the task summary
     */
    showTaskSummary() {
        this.elements.taskSummary.style.display = 'block';
        this.elements.taskSummary.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hide the task summary
     */
    hideTaskSummary() {
        this.elements.taskSummary.style.display = 'none';
        this.elements.taskSummary.setAttribute('aria-hidden', 'true');
    }

    /**
     * Update the task summary with current counts
     */
    updateTaskSummary() {
        const tasks = this.taskManager.getAllTasks();
        const completedTasks = tasks.filter(task => task.completed);
        
        this.elements.totalCount.textContent = tasks.length;
        this.elements.completedCount.textContent = completedTasks.length;
        
        // Update summary text for better UX
        const summaryText = this.elements.taskSummary.querySelector('.task-summary__text');
        if (completedTasks.length === tasks.length && tasks.length > 0) {
            summaryText.innerHTML = `🎉 All ${tasks.length} task${tasks.length === 1 ? '' : 's'} completed! Great job!`;
            summaryText.style.color = 'var(--color-success)';
        } else {
            summaryText.innerHTML = `<span id="completedCount">${completedTasks.length}</span> of <span id="totalCount">${tasks.length}</span> task${tasks.length === 1 ? '' : 's'} completed`;
            summaryText.style.color = 'var(--color-text-light)';
            // Re-cache the elements since we updated innerHTML
            this.elements.completedCount = document.getElementById('completedCount');
            this.elements.totalCount = document.getElementById('totalCount');
        }
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

/**
 * Feedback Manager - handles user feedback notifications
 */
class FeedbackManager {
    constructor() {
        this.container = document.getElementById('feedbackContainer');
        this.activeMessages = new Set();
    }

    /**
     * Show a feedback message
     * @param {string} message - The message text
     * @param {string} type - The message type ('success', 'error', 'info')
     * @param {number} duration - How long to show the message (ms)
     */
    showMessage(message, type = 'info', duration = 3000) {
        const messageElement = this.createMessageElement(message, type);
        
        // Add to container
        this.container.appendChild(messageElement);
        this.activeMessages.add(messageElement);
        
        // Trigger show animation
        requestAnimationFrame(() => {
            messageElement.classList.add('feedback-message--show');
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeMessage(messageElement);
        }, duration);
        
        return messageElement;
    }

    /**
     * Create a message element
     * @param {string} message - The message text
     * @param {string} type - The message type
     * @returns {HTMLElement} The message element
     */
    createMessageElement(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `feedback-message feedback-message--${type}`;
        
        const icon = this.getIconForType(type);
        
        messageEl.innerHTML = `
            <div class="feedback-message__content">
                <span class="feedback-message__icon">${icon}</span>
                <p class="feedback-message__text">${this.escapeHtml(message)}</p>
            </div>
        `;
        
        return messageEl;
    }

    /**
     * Get icon for message type
     * @param {string} type - The message type
     * @returns {string} The icon character
     */
    getIconForType(type) {
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Remove a message with animation
     * @param {HTMLElement} messageElement - The message to remove
     */
    removeMessage(messageElement) {
        if (!this.activeMessages.has(messageElement)) {
            return;
        }
        
        messageElement.classList.remove('feedback-message--show');
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
            this.activeMessages.delete(messageElement);
        }, 300); // Match transition duration
    }

    /**
     * Clear all messages
     */
    clearAll() {
        this.activeMessages.forEach(message => {
            this.removeMessage(message);
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - The text to escape
     * @returns {string} The escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the feedback manager
const feedbackManager = new FeedbackManager();

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
            
            // Add task with animation
            this.domManager.addTaskWithAnimation(newTask);
            
            // Show success feedback
            feedbackManager.showMessage('Task added successfully!', 'success', 2000);
            
            // Focus back on input for better UX
            this.elements.input.focus();
        } else {
            this.showInputError('Failed to create task');
            feedbackManager.showMessage('Failed to create task', 'error');
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
    // Load tasks from storage first
    taskManager.initializeTasks();
    
    // Initialize managers
    const inputManager = new InputManager(taskManager, domManager);
    
    // Initial render with loaded tasks
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