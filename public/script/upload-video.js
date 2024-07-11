import firebaseConfigPromise from './firebase-config.js';

firebaseConfigPromise.then(() => {
    const database = firebase.database();
    const storage = firebase.storage();

    let uniqueUserID = '';

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            fetchUserInfo(user.email).then(userData => {
                uniqueUserID = userData.user_id;
                console.log(uniqueUserID);

                document.querySelector('.browse-btn').addEventListener('click', function () {
                    document.querySelector('.file-input').click();
                });

                document.querySelector('.file-input').addEventListener('change', function (event) {
                    const file = event.target.files[0];
                    if (file) {
                        document.getElementById('videoSize').value = file.size;
                        document.getElementById('videoFormat').value = file.type;
                        document.getElementById('creationDate').value = new Date().toISOString();

                        // Assuming video_length can be calculated or set here if necessary
                        document.getElementById('videoLength').value = '00:00:00';
                        document.getElementById('user_id').value = uniqueUserID;
                    }
                });

                document.getElementById('uploadForm').addEventListener('submit', function (e) {
                    e.preventDefault();

                    const fileInput = document.querySelector('.file-input');
                    const file = fileInput.files[0];
                    if (file) {
                        const storageRef = storage.ref();
                        const videoRef = storageRef.child(`videos/${uniqueUserID}/${file.name}`);

                        const uploadTask = videoRef.put(file);

                        uploadTask.on('state_changed', 
                            (snapshot) => {
                                // Handle upload progress if needed
                            }, 
                            (error) => {
                                console.error(error);
                                alert('Error uploading video');
                            }, 
                            () => {
                                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                                    document.getElementById('VideoFileRef').value = downloadURL;
                                    document.getElementById('VideoFileName').value = file.name;

                                    const formData = new FormData(document.getElementById('uploadForm'));

                                    fetch('/upload-video', {
                                        method: 'POST',
                                        body: formData
                                    })
                                    .then(response => response.json())
                                    .then(data => {
                                        console.log(data);
                                        if (data.error) {
                                            alert(data.error);
                                        } else {
                                            alert('Video uploaded successfully');
                                            window.location.href = 'http://localhost:3000/profile'; 
                                        }
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        alert('Error uploading video');
                                    });
                                });
                            }
                        );
                    } else {
                        alert('No file selected');
                    }
                });
            }).catch(error => {
                console.error('Error fetching user data:', error);
            });
        } else {
            window.location.href = 'http://localhost:3000/profile'; 
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

    document.getElementById('cancel-button').addEventListener('click', () => {
        window.location.href = 'http://localhost:3000/profile'; 
    });
}).catch(error => {
    console.error('Failed to initialize Firebase:', error);
});
