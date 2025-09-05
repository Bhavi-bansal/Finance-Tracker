
document.addEventListener('DOMContentLoaded', () => {

    
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const TRANSACTIONS_KEY = `transactions_${currentUser}`;
    const CATEGORIES_KEY = `categories_${currentUser}`;

   
    const transactionForm = document.getElementById('transaction-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const categorySelect = document.getElementById('category');
    const typeToggle = document.getElementById('type-toggle');
    
    const newCategoryInput = document.getElementById('new-category');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryList = document.getElementById('category-list');
    const logoutBtn = document.getElementById('logout-btn');

    const transactionList = document.getElementById('transaction-list');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const balanceEl = document.getElementById('balance');

    const filterCategorySelect = document.getElementById('filter-category');

    const expenseChartCanvas = document.getElementById('expense-chart').getContext('2d');
    const incomeChartCanvas = document.getElementById('income-chart').getContext('2d');
    let expenseChart;
    let incomeChart;

    
    let transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY)) || [];
    let categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || ['Salary', 'Groceries', 'Bills', 'Entertainment', 'Freelance'];

    const saveData = () => {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    };

   

    const render = () => {
        updateSummary();
        applyFilters();
        updateCategoryDropdowns();
        renderCategories(); 
    };
    
    const updateSummary = () => {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        totalIncomeEl.textContent = `₹${income.toFixed(2)}`;
        totalExpensesEl.textContent = `₹${expenses.toFixed(2)}`;
        balanceEl.textContent = `₹${balance.toFixed(2)}`;
    };

    const renderTransactions = (transactionsToRender) => {
        transactionList.innerHTML = '';
        transactionsToRender.sort((a, b) => new Date(b.date) - new Date(a.date));
        transactionsToRender.forEach(transaction => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transaction.description}</td>
                <td class="${transaction.type}">${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}</td>
                <td>${transaction.date}</td>
                <td>${transaction.category}</td>
                <td><button class="btn btn-delete" data-id="${transaction.id}">Delete</button></td>
            `;
            transactionList.appendChild(tr);
        });
    };
    
    const updateCategoryDropdowns = () => {
        const optionsHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        categorySelect.innerHTML = optionsHTML;
        filterCategorySelect.innerHTML = `<option value="all">All Categories</option>${optionsHTML}`;
    };

    const renderCategories = () => {
        categoryList.innerHTML = ''; 
        categories.forEach(cat => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = cat;
            li.appendChild(span);
            categoryList.appendChild(li);
        });
    };

    const renderExpenseChart = (transactionsForChart) => {
        const expenseData = transactionsForChart
            .filter(t => t.type === 'expense')
            .reduce((acc, transaction) => {
                acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
                return acc;
            }, {});

        const chartLabels = Object.keys(expenseData);
        const chartData = Object.values(expenseData);

        if (expenseChart) expenseChart.destroy();

        expenseChart = new Chart(expenseChartCanvas, {
            type: 'doughnut',
            data: { 
                labels: chartLabels, 
                datasets: [{ 
                    label: 'Expenses',
                    data: chartData, 
                    backgroundColor: ['#e74c3c', '#9b59b6', '#f1c40f', '#34495e', '#e67e22', '#c0392b'] 
                }] 
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    const renderIncomeChart = (transactionsForChart) => {
        const incomeData = transactionsForChart
            .filter(t => t.type === 'income')
            .reduce((acc, transaction) => {
                acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
                return acc;
            }, {});

        const chartLabels = Object.keys(incomeData);
        const chartData = Object.values(incomeData);

        if (incomeChart) incomeChart.destroy();

        incomeChart = new Chart(incomeChartCanvas, {
            type: 'pie',
            data: { 
                labels: chartLabels, 
                datasets: [{ 
                    label: 'Income',
                    data: chartData, 
                    backgroundColor: ['#2ecc71', '#3498db', '#1abc9c', '#27ae60', '#2980b9'] 
                }] 
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    const addTransaction = (e) => {
        e.preventDefault();
        
        const amount = parseFloat(amountInput.value);
        if (amount <= 0 || !amount) {
            alert("Transaction amount must be a positive number.");
            return;
        }

        const newTransaction = {
            id: Date.now(),
            description: descriptionInput.value,
            amount: amount,
            date: dateInput.value,
            category: categorySelect.value,
            type: typeToggle.checked ? 'income' : 'expense',
        };

        transactions.push(newTransaction);
        saveData();
        render();
        transactionForm.reset();
        dateInput.valueAsDate = new Date();
        typeToggle.checked = true; 
    };

    const deleteTransaction = (id) => {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        render();
    };
    
    const addCategory = () => {
        const newCategory = newCategoryInput.value.trim();
        if (!newCategory) {
            alert("Category name cannot be empty.");
            return;
        }
        if (categories.map(c => c.toLowerCase()).includes(newCategory.toLowerCase())) {
            alert("This category already exists.");
            return;
        }

        categories.push(newCategory);
        saveData();
        render(); 
        newCategoryInput.value = '';
    };

    const applyFilters = () => {
        const category = filterCategorySelect.value;
        let filteredTransactions = transactions;

        if (category !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === category);
        }
        
        renderTransactions(filteredTransactions);
        renderExpenseChart(filteredTransactions);
        renderIncomeChart(filteredTransactions);
    };

    const logout = () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    };

    
    transactionForm.addEventListener('submit', addTransaction);
    addCategoryBtn.addEventListener('click', addCategory);
    logoutBtn.addEventListener('click', logout);

    transactionList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteTransaction(id);
        }
    });
    
    filterCategorySelect.addEventListener('change', applyFilters);

    
    dateInput.valueAsDate = new Date();
    render();
});
