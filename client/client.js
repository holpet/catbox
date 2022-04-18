console.log('Client has been initialized...');
const API_URL = 'http://localhost:5050/';

const allChats = document.querySelector('.allChats');

//loadExternalHTMLelements();
blurAndLoad(true);

$(window).on('load', () => {
    console.log('CONTROL STATUS: window has been loaded...');
    manageChatForm();
    manageRegisterForm();
    manageLoginForm();
    //manageSwitch();
    listAllChats();
 });

function loadExternalHTMLelements() {
    var status = true;
    $("#chat-messaging-form").load("./views/chat-messaging-form.html", (responseTxt, statusTxt, xhr) => {
        if (statusTxt !== "success") status = false;
    });
    $("#login-register-modals").load("./views/login-register-modals.html", (responseTxt, statusTxt, xhr) => {
        if (statusTxt !== "success") status = false;
    });
    return status;
}

function manageRegisterForm() {
    const regForm = document.querySelector('#registerForm');

    regForm.addEventListener('submit', (event) => {
        event.preventDefault();

        /* Reset form validator */
        $('#regUsernameCheck').text('Missing username.');
        $('#regEmailCheck').text('Missing / incorrect email.');
        $('#regUsernameInput').removeClass('is-invalid');
        $('#regEmailInput').removeClass('is-invalid');
    
        /* Get form data */
        const formData = new FormData(regForm);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
    
        blurAndLoad(true);
    
        const userData = {
            username,
            email,
            password
        };

        if (!regForm.checkValidity()) regForm.classList.add('was-validated');
        else regForm.classList.remove('was-validated');
    
        // Put user data into the database
        try {
            fetch(API_URL + 'register', {
                method: 'POST',
                body: JSON.stringify(userData),
                headers: {
                    'content-type': 'application/json'
                },
                credentials: "include"
            })  .then(async response => {

                    /* Server-side data validation */

                    // status OK
                    if (response.status === 200) {
                        console.log('Registration complete.');
                        // TODO: Alert success popup on registration + settime
                        regForm.reset();
                        $('#regUsernameInput').removeClass('is-invalid');
                        $('#regEmailInput').removeClass('is-invalid');
                        regForm.classList.remove('was-validated');
                        $('#loginModal').modal('hide');
                        //$('#tab-loginForm').tab('show');

                    }
                    // error: too many requests
                    else if (response.status === 429) {
                        // TODO: countdownTooManyRequests(10);
                    }
                    // error: username already in use
                    else if (response.status === 480) {
                        const body = await response.json();
                        $('#regUsernameCheck').text(body.error);
                        $('#regUsernameInput').addClass('is-invalid');
                    }
                    // error: email already in use
                    else if (response.status === 481) {
                        const body = await response.json();
                        $('#regEmailCheck').text(body.error);
                        $('#regEmailInput').addClass('is-invalid');
                    }
                    else {
                        const body = await response.json();
                        console.log(body.error);
                    }
                    blurAndLoad(false);
            });
        }
        catch (error) {
            throw boomify(error);
        }
    });
}

function manageLoginForm() {
    const logForm = document.querySelector('#loginForm');

    logForm.addEventListener('submit', (event) => {
        event.preventDefault();

        /* Reset validator form */
        $('#logEmailCheck').text('Missing email or username.');
        $('#logPasswordCheck').text('Missing password.');
        $('#logEmailInput').removeClass('is-invalid');
        $('#logPasswordInput').removeClass('is-invalid');
    
        const formData = new FormData(logForm);
        const email = formData.get('email');
        const password = formData.get('password');
    
        blurAndLoad(true);
    
        const userData = {
            email,
            password
        };
    
        if (!logForm.checkValidity()) logForm.classList.add('was-validated');
        else logForm.classList.remove('was-validated');

        if (email === '' || password === '') return;
    
        // Check user data against a database
        try {
            fetch(API_URL + 'login', {
                method: 'POST',
                body: JSON.stringify(userData),
                headers: {
                    'content-type': 'application/json'
                },
                credentials: "include"
            })  .then(async response => {
                    // status OK
                    console.log(response);
                    if (response.status === 200) {
                        console.log('Login complete.');
                        $('#loginModal').modal('hide');
                        logForm.reset();
                        logForm.classList.remove('was-validated');
                    }
                    else if (response.status === 401) {
                        const body = await response.json();
                        $('#logPasswordCheck').text(body.error);
                        $('#logEmailCheck').text('');
                        $('#logEmailInput').addClass('is-invalid');
                        $('#logPasswordInput').addClass('is-invalid');
                    }
                    blurAndLoad(false);
            })
        }
        catch (error) {
            throw boomify(error);
        }
    });
}

function manageChatForm() {
    const form = document.querySelector('#chatForm');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
    
        const formData = new FormData(form);
        const name = formData.get('name');
        const content = formData.get('message');
    
        blurAndLoad(true);
    
        const chat = {
            name,
            content
        };
    
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
        }
        else {
            form.classList.remove('was-validated');
            const messageTextArea = document.getElementById('messageTextArea');
            messageTextArea.value = '';
        }
    
        // Add chat into a database
        try {
            fetch(API_URL + 'chats', {
                method: 'POST',
                body: JSON.stringify(chat),
                headers: {
                    'content-type': 'application/json'
                },
                credentials: "include"
            })  .then(response => {
                    console.log(response);
                    // status OK
                    if (response.headers.status === response.headers.ok) {
                        console.log('Chat validated and sent.');
                    }
                    // error: too many requests
                    else if (response.headers.status === 429) {
                        countdownTooManyRequests(10);
                    }
                    // error missing name and/or message
                    else if (response.headers.status === 442) {
                        console.log("Missing name and/or content.");
                    }
                    return response.json();
            })
                .then(chat => {
                    listAllChats();
                    console.log(chat);
                });
        }
        catch (error) {
            throw boomify(error);
        }
    });
}



function listAllChats() {
    allChats.innerHTML = '';
    try {
        fetch(API_URL + 'chats', {
            credentials: "include"
        })
        .then(res => res.json())
        .then(chats => {
            const div = document.createElement('div');
            firstElem = true;
            chats.reverse();
            chats.forEach(chat => {
                // create divs
                const divCard = document.createElement('div');
                divCard.className = 'card card-border border-top-0 action-highlight';
                if (firstElem) {
                    divCard.classList.remove('border-top-0');
                    firstElem = false;
                }
                const divRow = document.createElement('div');
                divRow.className = 'row g-0 justify-content-left';
                const divCol1 = document.createElement('div');
                divCol1.className = 'col mx-auto icon-sidebar';
                const divCol2 = document.createElement('div');
                divCol2.className = 'col';
                const divCardBody = document.createElement('div');
                divCardBody.className = 'card-body pr-3 pl-1';
                const divCardBodySpec = document.createElement('div');
                divCardBodySpec.className = 'd-flex w-100 justify-content-between align-self-start';
                
                // create img
                const icon = document.createElement('img');
                icon.src = 'img/catbox_favicon_bigger.png';
                icon.className = 'img-fluid rounded-circle m-2 p-1 icon';
                icon.alt = 'User icon image';
                
                // create name & date
                const header = document.createElement('h5');
                header.className = 'card-title text-break';
                header.textContent = chat.name;
                const small = document.createElement('small');
                small.className = 'text-muted';
                small.textContent = convertDate(new Date(chat.created));
                
                // create message
                const content = document.createElement('p');
                content.className = 'card-text text-break';
                content.innerHTML = chat.content;

                // append divs with content
                divCol1.appendChild(icon);
                
                divCardBodySpec.appendChild(header);
                divCardBodySpec.appendChild(small);
                divCardBody.appendChild(divCardBodySpec);
                divCardBody.appendChild(content);
                divCol2.appendChild(divCardBody);

                divRow.appendChild(divCol1);
                divRow.appendChild(divCol2);

                divCard.appendChild(divRow);
                div.appendChild(divCard);
            });
            allChats.appendChild(div);
        });
    }
    catch (error) {
        throw boomify(error);
    }
    blurAndLoad(false);
}

/* Helper functions */

function convertDate(dateThen) {
    var dateNow = new Date();
    var duration = dateNow.valueOf() - dateThen.valueOf(); // The unit is millisecond
    var diff = parseInt(duration / 1000);
    if (diff == 1) return diff + ' second ago';
    else if (diff < 60) return diff + ' seconds ago';
    diff = parseInt(diff / 60);
    if (diff == 1) return diff + ' minute ago';
    else if (diff < 60) return diff + ' minutes ago';
    diff = parseInt(diff / 60);
    if (diff == 1) return diff + ' hour ago';
    else if (diff < 24) return diff + ' hours ago';
    diff = parseInt(diff / 24);
    if (diff == 1) return diff + ' day ago';
    else if (diff < 30) return diff + ' days ago';
    diff = parseInt(diff / 12);
    if (diff == 1) return diff + ' month ago';
    else if (diff < 6) return diff + ' months ago';
    else return dateThen.toLocaleDateString('cs-CZ');
}

function blurAndLoad(isLoading) {
    if (isLoading) {
        $('#loading').show();
        $('.container-fluid').addClass("blur");
        $('.allChats').addClass("blur");
    }
    else {
        $('#loading').hide();
        $('.container-fluid').removeClass("blur");
        $('.allChats').removeClass("blur");
    }
}

function countdownTooManyRequests(seconds) {
    // TODO: too many requests - cases for register & login

    countdownInterval = setInterval(() => {
        if (seconds === 1) {
            $('#submitButton').prop('disabled', false);
            $('#submitButton').html('Send your chat');
            clearInterval(countdownInterval);
        }
        else {
            $('#submitButton').prop('disabled', true);
            $('#submitButton').html('Please wait ' + seconds--);
        }
    }, 1000);
}


function manageSwitch() {
    const switchForm = document.querySelector('#flexSwitchCheckDefault');
    switchForm.addEventListener('change', (event) => {
        if ($('#switchLabel').is(":hidden")) {
            $('#switchLabel').show();
            $('#usernameInput').hide();
        }
        else {
            $('#switchLabel').hide();
            $('#usernameInput').show();
        }
    //const usernameInput = $('#usernameInput').hide();
    });
    
}