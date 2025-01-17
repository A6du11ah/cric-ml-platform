import firebaseConfigPromise from './firebase-config.js';

firebaseConfigPromise.then(() => {

    const database = firebase.database();
    const storage = firebase.storage();
    let uniqueUserID = '';

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            fetchUserInfo(user.email).then(userData => {

                displayUserInfo(userData);
                uniqueUserID = userData.user_id;
                console.log(uniqueUserID);
                loadVideos(uniqueUserID);

            }).catch(error => {
                console.error('Error fetching user data:', error);
            });
        } else {
            window.location.href = 'http://localhost:3000/login'; 
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

    function loadVideos(userId) {
        const videoItems = document.getElementById('video-items');
        
        fetch(`/videos/${userId}`)
            .then(response => response.json())
            .then(videos => {
                videoItems.innerHTML = '';
                videos.forEach(video => {
                    const li = document.createElement('li');
                    const videoElement = document.createElement('video');
                    videoElement.src = video.video_file_ref;
                    videoElement.controls = true;

                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Edit';
                    editBtn.onclick = () => openEditModal(video);

                    li.appendChild(videoElement);
                    li.appendChild(editBtn);
                    videoItems.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error loading videos:', error);
            });
    }

    function openEditModal(video) {
        const modal = document.getElementById('edit-video-modal');
        const titleInput = document.getElementById('video-title');
        const descriptionInput = document.getElementById('video-description');
        const saveButton = document.getElementById('save-video-button');
        const deleteButton = document.getElementById('delete-video-button');
        const checkPublic = document.getElementById('myCheckbox');
    
        checkPublic.checked = video.ispublic;
    
        titleInput.value = video.video_title || '';
        descriptionInput.value = video.description || '';
    
        modal.style.display = 'block';
    
        saveButton.onclick = () => saveVideoDetails(video.video_id, titleInput.value, descriptionInput.value, checkPublic.checked);
        deleteButton.onclick = () => deleteVideo(video.video_file_ref, video.video_file_name, modal, video.video_id);
        
        document.getElementById('close-modal-button').onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    async function saveVideoDetails(videoId, title, description, isPublic) {
        console.log(isPublic)
        try {
            const response = await fetch('/api/videos/update-video-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ videoId, title, description, isPublic })
            });
    
            if (!response.ok) {
                throw new Error('Failed to update video details');
            }
        console.log(isPublic)
            
            document.getElementById('edit-video-modal').style.display = 'none';
            loadVideos(uniqueUserID); 
        } catch (error) {
            console.error('Error updating video details:', error);
        }
    }
    


    function deleteVideo(fileRef, filePath, modal, videoId) {
        const videoItems = document.getElementById('video-items');
        const storageRef = storage.ref();
        const videoRef = storageRef.child(`videos/${uniqueUserID}/${filePath}`);
    
        videoRef.delete().then(async () => {
            await fetch('/api/videos/delete-video', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }, 
                body: JSON.stringify({ fileRef, videoId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                    alert('Error deleting video');
                } else {
                    console.log('Deleted:', filePath);
                    document.getElementById('edit-video-modal').style.display = 'none';
                    loadVideos(uniqueUserID);  // Reload videos to update the list
                }
            })
        }).catch((error) => {
            console.error('Error deleting video:', error);
        });
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

            displayUserInfo(userData); 
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
        firebase.auth().signOut().then(() => {
            window.location.href = 'http://localhost:3000/login'; 
        }).catch(error => {
            console.error(error);
        });
    });

    document.getElementById('upload-video-button').addEventListener('click', () => {
        window.location.href = 'http://localhost:3000/upload-page'; 
    });

    

}).catch(error => {
    console.error('Failed to initialize Firebase:', error);
});

