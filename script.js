let map;
let userMarker;
let parkingSpots = [];
let autocomplete;
let searchCircle;

// Theme switcher functionality
const themeSwitch = document.querySelector('#checkbox');
const body = document.body;

// Set default theme to dark if no theme is saved
const currentTheme = localStorage.getItem('theme') || 'dark';
body.setAttribute('data-theme', currentTheme);
if (currentTheme === 'light') {
    themeSwitch.checked = true;
}

// Theme switch event handler
themeSwitch.addEventListener('change', function(e) {
    if (e.target.checked) {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateMapStyle('light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateMapStyle('dark');
    }
});

// Update map styles for better contrast in both themes
function updateMapStyle(theme) {
    const lightStyle = [
        {
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#000000" }]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#000000" }]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels",
            "stylers": [{ "visibility": "on" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "color": "#dadada" }]
        }
    ];

    const darkStyle = [
        {
            "elementType": "geometry",
            "stylers": [{ "color": "#242f3e" }]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#242f3e" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#38414e" }]
        },
        {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "color": "#746855" }]
        }
    ];

    if (map) {
        map.setOptions({
            styles: theme === 'light' ? lightStyle : darkStyle
        });
    }
}

// Initialize the map and autocomplete
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        styles: [
            {
                "featureType": "poi.parking",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f5f5f5"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#c9c9c9"
                    }
                ]
            }
        ]
    });

    // Initialize the autocomplete
    const input = document.querySelector('.search-box input');
    autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['geocode', 'establishment']
    });

    // Add listener for place selection
    autocomplete.addListener('place_changed', handlePlaceSelection);

    // Add click listener to search button
    document.querySelector('.search-box button').addEventListener('click', handleSearch);

    // Get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                updateMapLocation(pos, 'Your Location');
            },
            () => {
                handleLocationError(true);
            }
        );
    } else {
        handleLocationError(false);
    }

    const currentTheme = localStorage.getItem('theme') || 'dark';
    updateMapStyle(currentTheme);
}

// Handle place selection from autocomplete
function handlePlaceSelection() {
    const place = autocomplete.getPlace();
    
    if (!place.geometry) {
        alert("No location details available for this place.");
        return;
    }

    const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
    };

    updateMapLocation(location, place.name);
}

// Handle search button click
function handleSearch() {
    const input = document.querySelector('.search-box input');
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: input.value }, (results, status) => {
        if (status === 'OK') {
            const location = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
            };
            updateMapLocation(location, input.value);
        } else {
            alert('Could not find location: ' + status);
        }
    });
}

// Update map location and nearby parking spots
function updateMapLocation(location, title) {
    // Clear existing markers and circle
    if (userMarker) userMarker.setMap(null);
    if (searchCircle) searchCircle.setMap(null);

    // Center map on new location
    map.setCenter(location);
    map.setZoom(15);

    // Add marker for selected location
    userMarker = new google.maps.Marker({
        position: location,
        map: map,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        },
        title: title
    });

    // Add circle to show search radius
    searchCircle = new google.maps.Circle({
        map: map,
        center: location,
        radius: 1000, // 1km radius
        fillColor: '#2962ff',
        fillOpacity: 0.1,
        strokeColor: '#2962ff',
        strokeWeight: 1
    });

    // Generate and display nearby parking spots
    generateNearbyParkingSpots(location);
}

// Generate nearby parking spots based on location
function generateNearbyParkingSpots(location) {
    // Clear existing parking spots
    parkingSpots.forEach(spot => {
        if (spot.marker) spot.marker.setMap(null);
    });
    parkingSpots = [];

    // Generate random spots within the circle radius
    for (let i = 0; i < 5; i++) {
        const spotLocation = generateRandomLocation(location, 1000);
        const spot = {
            id: i + 1,
            lat: spotLocation.lat,
            lng: spotLocation.lng,
            title: `Parking Spot ${i + 1}`,
            price: Math.floor(Math.random() * 100) + 50, // Random price between 50-150 rupees
            address: `${Math.floor(Math.random() * 999) + 1} ${['Main St', 'Oak Ave', 'Park Rd', 'Market St'][Math.floor(Math.random() * 4)]}`,
            distance: (Math.random() * 0.9 + 0.1).toFixed(1),
            rating: (Math.random() * 2 + 3).toFixed(1),
            reviews: Math.floor(Math.random() * 100) + 50,
            features: ["24/7 Access", "CCTV", "Covered"].sort(() => 0.5 - Math.random()).slice(0, 2),
            available: Math.random() > 0.3 ? "available" : "limited",
            spots_left: Math.floor(Math.random() * 8) + 1
        };
        parkingSpots.push(spot);
    }

    displayParkingSpots(parkingSpots);
}

// Generate random location within radius
function generateRandomLocation(center, radius) {
    const r = radius * Math.sqrt(Math.random()) / 111300; // Convert radius to degrees
    const theta = Math.random() * 2 * Math.PI;
    
    return {
        lat: center.lat + r * Math.cos(theta),
        lng: center.lng + r * Math.sin(theta)
    };
}

// Update the displayParkingSpots function to include custom markers
function displayParkingSpots(spots) {
    const spotsList = document.getElementById('parkingSpots');
    spotsList.innerHTML = '';

    spots.forEach(spot => {
        // Create custom marker icon
        const markerIcon = {
            url: spot.available === 'available' ? 
                'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
                'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
            scaledSize: new google.maps.Size(32, 32)
        };

        // Add marker to map
        const marker = new google.maps.Marker({
            position: { lat: spot.lat, lng: spot.lng },
            map: map,
            icon: markerIcon,
            title: spot.title,
            animation: google.maps.Animation.DROP
        });

        spot.marker = marker; // Store marker reference

        // Create the stars HTML
        const starsHtml = '★'.repeat(Math.floor(spot.rating)) + 
                         (spot.rating % 1 ? '½' : '') +
                         '☆'.repeat(5 - Math.ceil(spot.rating));

        // Add to list
        const spotElement = document.createElement('div');
        spotElement.className = 'parking-spot';
        spotElement.innerHTML = `
            <div class="parking-spot-header">
                <div>
                    <span class="availability-indicator ${spot.available}"></span>
                    <h3 class="parking-spot-title">${spot.title}</h3>
                </div>
                <span class="parking-spot-price">₹${spot.price}/hr</span>
            </div>
            <div class="parking-spot-info">
                <div class="parking-spot-rating">
                    <span class="star-rating">${starsHtml}</span>
                    <span>(${spot.reviews})</span>
                </div>
                <div class="parking-spot-distance">
                    <i class="fas fa-location-arrow"></i>
                    <span>${spot.distance} km</span>
                </div>
            </div>
            <div class="parking-spot-address">
                <i class="fas fa-map-marker-alt"></i> ${spot.address}
            </div>
            <div class="parking-spot-features">
                ${spot.features.map(feature => `
                    <span class="feature-tag">
                        <i class="fas fa-check"></i> ${feature}
                    </span>
                `).join('')}
            </div>
            <div class="spots-available">
                ${spot.spots_left} spots available
            </div>
            <button class="book-btn" onclick="bookSpot(${spot.id})">
                Book Now
            </button>
        `;
        spotsList.appendChild(spotElement);

        // Add click listener to marker
        marker.addListener('click', () => {
            showSpotDetails(spot);
            spotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
}

// Add these functions to handle booking
const bookingModal = document.getElementById('bookingModal');
let currentSpot = null;

function bookSpot(spotId) {
    currentSpot = parkingSpots.find(spot => spot.id === spotId);
    const spotDetails = document.querySelector('.spot-details');
    
    // Set minimum datetime for inputs
    const now = new Date();
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    startTime.min = now.toISOString().slice(0, 16);
    endTime.min = now.toISOString().slice(0, 16);

    // Display spot details
    spotDetails.innerHTML = `
        <h3>${currentSpot.title}</h3>
        <p><i class="fas fa-map-marker-alt"></i> ${currentSpot.address}</p>
        <p><i class="fas fa-money-bill"></i> ₹${currentSpot.price}/hour</p>
        <p><i class="fas fa-car"></i> ${currentSpot.spots_left} spots available</p>
    `;

    // Show modal
    bookingModal.style.display = "block";
    updatePrice();
}

// Calculate and update price
function updatePrice() {
    const startTime = new Date(document.getElementById('startTime').value);
    const endTime = new Date(document.getElementById('endTime').value);

    if (startTime && endTime && startTime < endTime) {
        const hours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
        const basePrice = currentSpot.price * hours;

        document.getElementById('basePrice').textContent = `₹${basePrice}`;
        document.getElementById('duration').textContent = `${hours} hrs`;
        document.getElementById('totalPrice').textContent = `₹${basePrice}`;
    }
}

// Add event listeners for time inputs
document.getElementById('startTime').addEventListener('change', updatePrice);
document.getElementById('endTime').addEventListener('change', updatePrice);

// Handle booking form submission
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const bookingDetails = {
        spotId: currentSpot.id,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        vehicleNumber: document.getElementById('vehicleNumber').value,
        vehicleType: document.getElementById('vehicleType').value,
        totalAmount: document.getElementById('totalPrice').textContent
    };

    // Show confirmation
    alert(`Booking Confirmed!\n\nSpot: ${currentSpot.title}\nTotal Amount: ${bookingDetails.totalAmount}\nVehicle: ${bookingDetails.vehicleNumber}`);
    
    // Reset and close modal
    bookingModal.style.display = "none";
    this.reset();
    
    // Reset price summary
    document.getElementById('basePrice').textContent = '₹0';
    document.getElementById('duration').textContent = '0 hrs';
    document.getElementById('totalPrice').textContent = '₹0';
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Show spot details in a modal
function showSpotDetails(spot) {
    // Implement modal with spot details
}

// Handle location errors
function handleLocationError(browserHasGeolocation) {
    alert(
        browserHasGeolocation
            ? "Error: The Geolocation service failed."
            : "Error: Your browser doesn't support geolocation."
    );
}

// Initialize map when the page loads
window.onload = initMap;

// Reviews slider functionality
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.reviews-slider');
    const prevBtn = document.querySelector('.review-nav.prev');
    const nextBtn = document.querySelector('.review-nav.next');
    let slideIndex = 0;

    function updateSlider() {
        const cards = document.querySelectorAll('.review-card');
        const cardWidth = cards[0].offsetWidth + 32; // Including gap
        slider.style.transform = `translateX(-${slideIndex * cardWidth}px)`;
    }

    prevBtn.addEventListener('click', () => {
        if (slideIndex > 0) {
            slideIndex--;
            updateSlider();
        }
    });

    nextBtn.addEventListener('click', () => {
        const cards = document.querySelectorAll('.review-card');
        if (slideIndex < cards.length - 3) { // Show 3 cards at a time
            slideIndex++;
            updateSlider();
        }
    });

    // Update slider on window resize
    window.addEventListener('resize', updateSlider);
});

// Modal functionality
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginBtn = document.querySelector('.login-btn');
const signupBtn = document.querySelector('.signup-btn');
const closeBtns = document.querySelectorAll('.close');

loginBtn.onclick = () => loginModal.style.display = "block";
signupBtn.onclick = () => signupModal.style.display = "block";

closeBtns.forEach(btn => {
    btn.onclick = function() {
        const modal = this.closest('.modal');
        modal.style.display = "none";
        
        // Reset booking form if it's the booking modal
        if (modal.id === 'bookingModal') {
            document.getElementById('bookingForm').reset();
            // Reset price summary
            document.getElementById('basePrice').textContent = '₹0';
            document.getElementById('duration').textContent = '0 hrs';
            document.getElementById('totalPrice').textContent = '₹0';
        }
    }
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
        
        // Reset booking form if it's the booking modal
        if (event.target.id === 'bookingModal') {
            document.getElementById('bookingForm').reset();
            // Reset price summary
            document.getElementById('basePrice').textContent = '₹0';
            document.getElementById('duration').textContent = '0 hrs';
            document.getElementById('totalPrice').textContent = '₹0';
        }
    }
}

function showLoginModal() {
    signupModal.style.display = "none";
    loginModal.style.display = "block";
}

function showSignupModal() {
    loginModal.style.display = "none";
    signupModal.style.display = "block";
}

// Form submission handling
document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();
    // Add your login logic here
    alert('Login functionality will be implemented in the full version');
}

document.getElementById('signupForm').onsubmit = function(e) {
    e.preventDefault();
    // Add your signup logic here
    alert('Signup functionality will be implemented in the full version');
}

// Handle mobile menu
document.addEventListener('DOMContentLoaded', function() {
    // Add touch event handling for review cards
    const reviewCards = document.querySelectorAll('.review-card');
    reviewCards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Optimize map interaction for mobile
    if (map) {
        map.setOptions({
            gestureHandling: 'cooperative', // Makes it easier to scroll on mobile
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            }
        });
    }

    // Add swipe functionality for reviews
    let touchStartX = 0;
    let touchEndX = 0;
    
    const slider = document.querySelector('.reviews-slider');
    if (slider) {
        slider.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        slider.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
    }

    function handleSwipe() {
        const SWIPE_THRESHOLD = 50;
        const difference = touchStartX - touchEndX;
        
        if (Math.abs(difference) > SWIPE_THRESHOLD) {
            if (difference > 0) {
                // Swipe left
                document.querySelector('.review-nav.next')?.click();
            } else {
                // Swipe right
                document.querySelector('.review-nav.prev')?.click();
            }
        }
    }
});

// Update the map resize handling
window.addEventListener('resize', function() {
    if (map) {
        google.maps.event.trigger(map, 'resize');
        if (userMarker) {
            map.setCenter(userMarker.getPosition());
        }
    }
}); 