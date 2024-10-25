// Create the scene and camera for 3D model
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 600 / 400, 0.1, 1000);

// Enable alpha transparency in the renderer
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(600, 400);
document.getElementById('model-container').appendChild(renderer.domElement);

// Add ambient and directional lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);  // Global light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 3, 1).normalize();
scene.add(directionalLight);

// Variables to store mouse position and window dimensions
let mouse = new THREE.Vector2();
let targetRotation = new THREE.Euler();  // Store target rotation

document.addEventListener('mousemove', onDocumentMouseMove, false);

function onDocumentMouseMove(event) {
    // Normalize mouse position to range [-1, 1]
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Load the OBJ model
const objLoader = new THREE.OBJLoader();
objLoader.load('tarothood2.obj', function (object) {
    scene.add(object);

    // Position the model and camera
    object.position.set(0, 0, 1);  // Adjust position to center the object
    object.scale.set(1, 1, 1);  // Adjust scale as needed

    // Adjust camera position for better view
    camera.position.z = 7;  // Move the camera back if necessary

    // Floating animation
    let clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        // Floating effect
        let time = clock.getElapsedTime();
        object.position.y = Math.sin(time) * 0.5;

        // Convert the 2D cursor position to a 3D direction from the camera
        let vector = new THREE.Vector3(mouse.x, mouse.y, 0.8);
        vector.unproject(camera);

        // Calculate direction vector from the object to the cursor
        let direction = vector.sub(object.position).normalize();

        // Calculate rotation angles
        targetRotation.y = Math.atan2(direction.x, direction.z);  // Left-right rotation (Y-axis)
        targetRotation.x = -Math.atan2(direction.y, direction.z); // Up-down rotation (X-axis)

        // Smoothly interpolate to the target rotation
        object.rotation.x += (targetRotation.x - object.rotation.x) * 1;
        object.rotation.y += (targetRotation.y - object.rotation.y) * 1;

        renderer.render(scene, camera);
    }
    animate();
}, undefined, function (error) {
    console.error('An error occurred while loading the OBJ file:', error);
});

// Chat functionality (unchanged)
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const apiKeyInput = document.getElementById('api-key-input');
const testApiKeyButton = document.getElementById('test-api-key');
const consoleOutput = document.getElementById('console-output');

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
testApiKeyButton.addEventListener('click', testApiKey);

// Function to simulate typewriter effect
function typeWriterEffect(text, element) {
    let i = 0;
    const speed = 50; // Adjust speed of typewriting here (milliseconds per character)
    element.innerHTML = ''; // Clear any previous content

    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}
// Modified log function
function log(text) {
    const logContainer = document.getElementById('log-container'); // Assuming you have an element with this ID
    const newLogEntry = document.createElement('div');
    logContainer.appendChild(newLogEntry);

    // Call the typewriter effect function
    typeWriterEffect(text, newLogEntry);
}


function log(message) {
    console.log(message);
    consoleOutput.textContent += message + '\n';
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

async function testApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        log('Please enter an API key.');
        return;
    }

    log('Testing API key...');
    try {
        const response = await fetch('https://api.openai.com/v1/engines', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            log('API key is valid!');
        } else {
            log('API key is invalid. Please check and try again.');
        }
    } catch (error) {
        log(`Error testing API key: ${error.message}`);
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!message) return;
    if (!apiKey) {
        log('Please enter an API key before sending a message.');
        return;
    }

    addMessageToChat('You', message);
    messageInput.value = '';

    log('Sending message to OpenAI API...');
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: "You are a dramatic and mysterious tarot card reader. Create a simulated tarot card reading interaction. Accept a user's question about a future occurrence, wait for user input, shuffle a deck of tarot cards and ask the user to draw a random card from the deck by asking them to choose a number from 1 to 78, then provide a meaningful interpretation based on the selected card associated with the card they picked, and finally inquire about whether they want to have another card drawn. If the user says yes, you will repeat the entire card selection process again only once. If the user says no, you will conclude the interaction by asking for a tip. If the user does not leave a tip, say goodbye rudely in all caps and end the interaction by asking no more questions to the user. If the user does leave a tip, say goodbye politely and tell them to come again and ask no more questions."
                },
                {
                    role: "user",
                    content: message
                }],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content.trim();
        log('Received response from OpenAI API');
        addMessageToChat('TarotBot 🔮', aiResponse);
    } catch (error) {
        log(`Error: ${error.message}`);
        addMessageToChat('TarotBot 🔮', 'Sorry, there was an error processing your request.');
    }
}

function addMessageToChat(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
