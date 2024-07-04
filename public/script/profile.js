import firebaseConfigPromise from './firebase-config.js';

firebaseConfigPromise.then(() => {

const database = firebase.database();
const storage = firebase.storage();

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        fetchUserInfo(user.email).then(userData => {
            displayUserInfo(userData);
        }).catch(error => {
            console.error('Error fetching user data:', error);
        });
    } else {
        window.location.href = 'index.html'; 
    }
});

async function fetchUserInfo(email) {
    const response = await fetch('http://localhost:3000/api/users/getUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user data');
    }

    return response.json();
}

function displayUserInfo(userData) {
    const profileInfo = document.getElementById('profile-info');
    document.getElementById('display-name').innerText = userData.user_name;
    document.getElementById('display-email').innerText = userData.email;
    document.getElementById('profile-picture').src = userData.picture_ref;

    setupEditButtons(userData);
}

function setupEditButtons(userData) {
    document.getElementById('edit-button').addEventListener('click', () => {
        document.getElementById('edit-options').style.display = 'block';
    });

    document.getElementById('edit-name-button').addEventListener('click', () => {
        document.getElementById('name-input').value = userData.user_name;
        toggleEditName(true);
    });

    document.getElementById('edit-picture-button').addEventListener('click', () => {
        document.getElementById('picture-input').click();
    });

    document.getElementById('save-button').addEventListener('click', async () => {
        const newName = document.getElementById('name-input').value;
        const file = document.getElementById('picture-input').files[0];
        
        if (newName && newName !== userData.user_name) {
            try {
                await fetch('http://localhost:3000/api/users/updateName', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: userData.email, user_name: newName })
                });
                userData.user_name = newName;
            } catch (error) {
                console.error('Error updating name:', error);
            }
        }

        if (file) {
            try {
                const storageRef = storage.ref();
                const profilePicRef = storageRef.child('profile_pictures/' + firebase.auth().currentUser.uid);
                await profilePicRef.put(file);
                const newPhotoURL = await profilePicRef.getDownloadURL();
                await fetch('http://localhost:3000/api/users/updatePicture', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: userData.email, picture_ref: newPhotoURL })
                });
                userData.picture_ref = newPhotoURL;
            } catch (error) {
                console.error('Error updating picture:', error);
            }
        }

        displayUserInfo(userData); // Refresh displayed user info
        toggleEditName(false);
        toggleEditOptions(false);
        toggleEditPicture(false);
    });

    document.getElementById('picture-input').addEventListener('change', () => {
        toggleEditPicture(true);
    });
}

function toggleEditName(editing) {
    document.getElementById('display-name').style.display = editing ? 'none' : 'inline';
    document.getElementById('name-input').style.display = editing ? 'inline' : 'none';
    document.getElementById('save-button').style.display = editing ? 'inline' : 'none';
}

function toggleEditPicture(editing) {
    document.getElementById('profile-picture').style.display = editing ? 'none' : 'inline';
    document.getElementById('picture-input').style.display = editing ? 'inline' : 'none';
    document.getElementById('save-button').style.display = editing ? 'inline' : 'none';
}

function toggleEditOptions(show) {
    document.getElementById('edit-options').style.display = show ? 'block' : 'none';
    document.getElementById('edit-button').style.display = show ? 'none' : 'inline';
}

document.getElementById('logout-button').addEventListener('click', () => {
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).update({
        logoutTime: new Date().toString(),
        login_status: 'false',
        logout_status: 'true'
    });
    firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
    }).catch(error => {
        console.error(error);
    });
});
}).catch(error => {
    console.error('Failed to initialize Firebase:', error);
});
