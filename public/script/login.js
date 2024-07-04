
import firebaseConfigPromise from './firebase-config.js';

firebaseConfigPromise.then(() => {

document.getElementById('login-with-google-button').addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);

        const fullName = result.user.displayName;

        const userData = {
            email: result.user.email,
            user_name: fullName,
            picture_ref: result.user.photoURL,
            user_role: 'user', // Assuming default role is 'user', adjust as necessary
            provider: 'google' // As we're using Google Sign-In
        };

        // Save user data in PostgreSQL
        const response = await fetch('http://localhost:3000/api/createUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.status === 201) {
            console.log('New user created:', data);
        } else if (response.status === 200 && data.message === 'User already exists') {
            console.log('User already exists');
        }

        console.log('Redirecting to profile.html');
        window.location.href = 'http://localhost:3000/profile';
    } catch (error) {
        console.error(error);
    }
});

}).catch(error => {
    console.error('Failed to initialize Firebase:', error);
});
