import "./style.css";

// DOM Elements
const nextButton = document.getElementById("next");
const prevButton = document.getElementById("prev");
const carousel = document.querySelector(".carousel");
const listHTML = document.querySelector(".carousel .list");
const backButton = document.getElementById("back");
const modal = document.getElementById("details-modal");
const modalContent = document.getElementById("modal-content");
const closeModal = document.querySelector(".close-modal");
const caughtList = document.getElementById("caught-list");

// Number of Pokémon to display
const POKEMON_COUNT = 20;
const TOTAL_POKEMON_COUNT = 1010; // Total available in the API (Gen 1-9)

// Store all fetched Pokemon data
let allPokemonData = [];
// Store caught Pokemon
let caughtPokemon = JSON.parse(localStorage.getItem('caughtPokemon')) || [];

// Function to generate random Pokemon IDs (1-1010)
function getRandomPokemonIds(count) {
  const ids = new Set();
  while (ids.size < count) {
    ids.add(Math.floor(Math.random() * TOTAL_POKEMON_COUNT) + 1);
  }
  return Array.from(ids);
}

// Function to fetch a single Pokemon's data
async function fetchPokemon(id) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch Pokémon #${id}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Function to fetch Pokemon species data (for description)
async function fetchPokemonSpecies(id) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch Pokémon species #${id}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Function to create a Pokemon card HTML
function createPokemonCard(pokemon, species) {
  const description = getEnglishFlavorText(species);
  
  // Get Pokemon types
  const types = pokemon.types.map(t => t.type.name).join(', ');
  
  // Get stats
  const stats = pokemon.stats.reduce((acc, stat) => {
    acc[stat.stat.name] = stat.base_stat;
    return acc;
  }, {});

  // Format height and weight
  const height = (pokemon.height / 10).toFixed(1); // Convert to meters
  const weight = (pokemon.weight / 10).toFixed(1); // Convert to kg
  
  // Check if this Pokemon is caught
  const isCaught = caughtPokemon.some(p => p.id === pokemon.id);
  const catchBtnText = isCaught ? "RELEASE" : "CATCH";
  const catchBtnClass = isCaught ? "release-btn" : "catch-btn";
  
  return `
    <div class="item" data-pokemon-id="${pokemon.id}">
      <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}" />
      <div class="introduce">
        <div class="title">POKÉMON #${pokemon.id}</div>
        <div class="topic">${capitalizeFirstLetter(pokemon.name)}</div>
        <div class="des">
          ${description || 'No description available for this Pokémon.'}
        </div>
        <button class="seeMore">SEE MORE &#8599;</button>
      </div>
      <div class="detail">
        <div class="title">${capitalizeFirstLetter(pokemon.name)}</div>
        <div class="des">
          ${description || 'No description available for this Pokémon.'}
        </div>
        <div class="specifications">
          <div>
            <p>Type</p>
            <p>${capitalizeFirstLetter(types)}</p>
          </div>
          <div>
            <p>Height</p>
            <p>${height} m</p>
          </div>
          <div>
            <p>Weight</p>
            <p>${weight} kg</p>
          </div>
          <div>
            <p>HP</p>
            <p>${stats.hp}</p>
          </div>
          <div>
            <p>Attack</p>
            <p>${stats.attack}</p>
          </div>
        </div>
        <div class="checkout">
          <button class="${catchBtnClass}" data-pokemon-id="${pokemon.id}">${catchBtnText}</button>
          <button class="view-details-btn" data-pokemon-id="${pokemon.id}">VIEW DETAILS</button>
        </div>
      </div>
    </div>
  `;
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Get English description from species data
function getEnglishFlavorText(species) {
  if (!species || !species.flavor_text_entries) return null;
  
  const englishEntry = species.flavor_text_entries.find(
    entry => entry.language.name === 'en'
  );
  
  return englishEntry ? englishEntry.flavor_text.replace(/[\n\f]/g, ' ') : null;
}

// Create Pokemon modal with detailed information
function createPokemonModal(pokemon, species) {
  // Get all the details we need
  const description = getEnglishFlavorText(species);
  const types = pokemon.types.map(type => type.type.name);
  const abilities = pokemon.abilities.map(ability => ability.ability.name);
  const stats = pokemon.stats;
  const moves = pokemon.moves.slice(0, 10); // Just show first 10 moves
  
  // Format height and weight
  const height = (pokemon.height / 10).toFixed(1); // Convert to meters
  const weight = (pokemon.weight / 10).toFixed(1); // Convert to kg
  
  // Create type badges HTML
  const typesHTML = types.map(type => 
    `<div class="pokemon-type ${type}">${type}</div>`
  ).join('');
  
  // Create abilities HTML
  const abilitiesHTML = abilities.map(ability => 
    `<div class="ability">${ability.replace('-', ' ')}</div>`
  ).join('');
  
  // Create stats HTML
  const statsHTML = stats.map(stat => `
    <div class="stat-item">
      <div class="stat-name">${capitalizeFirstLetter(stat.stat.name.replace('-', ' '))}</div>
      <div class="stat-value">${stat.base_stat}</div>
    </div>
  `).join('');
  
  // Create moves HTML
  const movesHTML = moves.map(move => 
    `<div class="ability">${move.move.name.replace('-', ' ')}</div>`
  ).join('');
  
  // Full modal content
  return `
    <div class="pokemon-details">
      <div class="pokemon-image-container">
        <img class="pokemon-image" src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}">
        <div class="pokemon-sprite-container">
          <img src="${pokemon.sprites.front_default}" alt="${pokemon.name} front">
          ${pokemon.sprites.back_default ? `<img src="${pokemon.sprites.back_default}" alt="${pokemon.name} back">` : ''}
        </div>
      </div>
      <div class="pokemon-info">
        <h1 class="pokemon-name">${capitalizeFirstLetter(pokemon.name)}</h1>
        <div class="pokemon-number">Pokémon #${pokemon.id}</div>
        
        <div class="pokemon-types">
          ${typesHTML}
        </div>
        
        <p class="pokemon-description">
          ${description || 'No description available for this Pokémon.'}
        </p>
        
        <h3>Base Stats</h3>
        <div class="pokemon-stats">
          ${statsHTML}
          <div class="stat-item">
            <div class="stat-name">Height</div>
            <div class="stat-value">${height} m</div>
          </div>
          <div class="stat-item">
            <div class="stat-name">Weight</div>
            <div class="stat-value">${weight} kg</div>
          </div>
        </div>
        
        <div class="pokemon-abilities">
          <h3 class="abilities-title">Abilities</h3>
          ${abilitiesHTML}
        </div>
        
        <div class="pokemon-moves">
          <h3 class="abilities-title">Sample Moves</h3>
          ${movesHTML}
        </div>
        
        <button class="catch-modal-btn ${caughtPokemon.some(p => p.id === pokemon.id) ? 'release-btn' : 'catch-btn'}" data-pokemon-id="${pokemon.id}">
          ${caughtPokemon.some(p => p.id === pokemon.id) ? 'RELEASE POKÉMON' : 'CATCH POKÉMON'}
        </button>
      </div>
    </div>
  `;
}

// Update the caught Pokemon list display
function updateCaughtPokemonList() {
  caughtList.innerHTML = '';
  
  if (caughtPokemon.length === 0) {
    caughtList.innerHTML = '<p class="no-pokemon">You haven\'t caught any Pokémon yet!</p>';
    return;
  }
  
  caughtPokemon.forEach(pokemon => {
    const pokemonElement = document.createElement('div');
    pokemonElement.className = 'caught-pokemon';
    pokemonElement.setAttribute('data-pokemon-id', pokemon.id);
    
    pokemonElement.innerHTML = `
      <img src="${pokemon.image}" alt="${pokemon.name}">
      <div class="name">${pokemon.name}</div>
      <div class="id">#${pokemon.id}</div>
    `;
    
    pokemonElement.addEventListener('click', () => {
      const fullPokemon = allPokemonData.find(p => p.pokemon.id === pokemon.id);
      if (fullPokemon) {
        showPokemonDetails(fullPokemon.pokemon, fullPokemon.species);
      } else {
        // If we don't have full data (e.g. after page refresh), fetch it
        fetchPokemonDetails(pokemon.id);
      }
    });
    
    caughtList.appendChild(pokemonElement);
  });
}

// Fetch full Pokemon details
async function fetchPokemonDetails(id) {
  try {
    const pokemon = await fetchPokemon(id);
    const species = await fetchPokemonSpecies(id);
    
    if (pokemon && species) {
      showPokemonDetails(pokemon, species);
    }
  } catch (error) {
    console.error('Error fetching Pokemon details:', error);
  }
}

// Catch or release a Pokemon
function toggleCatchPokemon(pokemonId) {
  // Find if already caught
  const index = caughtPokemon.findIndex(p => p.id === pokemonId);
  
  if (index > -1) {
    // Release Pokemon
    caughtPokemon.splice(index, 1);
  } else {
    // Find Pokemon data
    const pokemonData = allPokemonData.find(p => p.pokemon.id === pokemonId);
    
    if (pokemonData) {
      const { pokemon } = pokemonData;
      
      // Add to caught list
      caughtPokemon.push({
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.sprites.front_default
      });
      
      // Show catch animation
      const pokemonImages = document.querySelectorAll(`[data-pokemon-id="${pokemonId}"] img`);
      pokemonImages.forEach(img => {
        img.classList.add('catch-success');
        setTimeout(() => img.classList.remove('catch-success'), 500);
      });
    }
  }
  
  // Save to localStorage
  localStorage.setItem('caughtPokemon', JSON.stringify(caughtPokemon));
  
  // Update button text on all instances
  updateCatchButtonsState(pokemonId);
  
  // Update the caught Pokemon list
  updateCaughtPokemonList();
}

// Update catch button text based on caught status
function updateCatchButtonsState(pokemonId) {
  const isCaught = caughtPokemon.some(p => p.id === pokemonId);
  
  // Update carousel buttons
  const catchButtons = document.querySelectorAll(`.catch-btn[data-pokemon-id="${pokemonId}"], .release-btn[data-pokemon-id="${pokemonId}"]`);
  catchButtons.forEach(button => {
    button.textContent = isCaught ? "RELEASE" : "CATCH";
    button.className = isCaught ? "release-btn" : "catch-btn";
  });
  
  // Update modal button if open
  const modalCatchBtn = document.querySelector('.catch-modal-btn');
  if (modalCatchBtn && parseInt(modalCatchBtn.getAttribute('data-pokemon-id')) === pokemonId) {
    modalCatchBtn.textContent = isCaught ? "RELEASE POKÉMON" : "CATCH POKÉMON";
    modalCatchBtn.className = `catch-modal-btn ${isCaught ? 'release-btn' : 'catch-btn'}`;
  }
}

// Show Pokemon details in modal
function showPokemonDetails(pokemon, species) {
  modalContent.innerHTML = createPokemonModal(pokemon, species);
  modal.classList.add('show');
  
  // Add event listener to the catch button in modal
  const catchBtn = document.querySelector('.catch-modal-btn');
  if (catchBtn) {
    catchBtn.addEventListener('click', () => {
      const pokemonId = parseInt(catchBtn.getAttribute('data-pokemon-id'));
      toggleCatchPokemon(pokemonId);
    });
  }
  
  // Prevent scrolling on the body
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeDetailModal() {
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
}

// Initialize the carousel with Pokemon data
async function initCarousel() {
  const randomIds = getRandomPokemonIds(POKEMON_COUNT);
  listHTML.innerHTML = '<div class="loading">Loading Pokémon...</div>';
  
  try {
    // Reset stored data
    allPokemonData = [];
    
    // Fetch all Pokemon data in parallel
    const pokemonPromises = randomIds.map(id => fetchPokemon(id));
    const pokemonResults = await Promise.all(pokemonPromises);
    const validPokemon = pokemonResults.filter(pokemon => pokemon !== null);
    
    // Fetch species data for each Pokemon
    const speciesPromises = validPokemon.map(pokemon => fetchPokemonSpecies(pokemon.id));
    const speciesResults = await Promise.all(speciesPromises);
    
    // Store the data for later use
    validPokemon.forEach((pokemon, index) => {
      allPokemonData.push({
        pokemon,
        species: speciesResults[index]
      });
    });
    
    // Generate HTML for each Pokemon
    listHTML.innerHTML = validPokemon.map((pokemon, index) => 
      createPokemonCard(pokemon, speciesResults[index])
    ).join('');
    
    // Reattach event listeners
    attachEventListeners();
    
    // Update the caught Pokemon display
    updateCaughtPokemonList();
  } catch (error) {
    console.error('Failed to load Pokémon data:', error);
    listHTML.innerHTML = '<div class="error">Failed to load Pokémon data. Please try again.</div>';
  }
}

// Attach event listeners to buttons
function attachEventListeners() {
  const seeMoreButtons = document.querySelectorAll(".seeMore");
  const catchButtons = document.querySelectorAll(".catch-btn, .release-btn");
  const viewDetailsButtons = document.querySelectorAll(".view-details-btn");
  const pokemonImages = document.querySelectorAll(".carousel .list .item img");
  
  nextButton.onclick = function() {
    showSlider("next");
  };
  
  prevButton.onclick = function() {
    showSlider("prev");
  };
  
  seeMoreButtons.forEach((button) => {
    button.onclick = function() {
      carousel.classList.remove("next", "prev");
      carousel.classList.add("showDetail");
    };
  });
  
  // Make Pokemon images clickable to show details
  pokemonImages.forEach((img) => {
    img.style.cursor = "pointer";
    img.onclick = function() {
      carousel.classList.remove("next", "prev");
      // Toggle the showDetail class
      carousel.classList.toggle("showDetail");
    };
  });
  
  backButton.onclick = function() {
    carousel.classList.remove("showDetail");
  };
  
  // Catch/Release Pokemon buttons
  catchButtons.forEach(button => {
    button.addEventListener('click', () => {
      const pokemonId = parseInt(button.getAttribute('data-pokemon-id'));
      toggleCatchPokemon(pokemonId);
    });
  });
  
  // View Details buttons
  viewDetailsButtons.forEach(button => {
    button.addEventListener('click', () => {
      const pokemonId = parseInt(button.getAttribute('data-pokemon-id'));
      const pokemonData = allPokemonData.find(p => p.pokemon.id === pokemonId);
      
      if (pokemonData) {
        showPokemonDetails(pokemonData.pokemon, pokemonData.species);
      }
    });
  });
  
  // Close modal event
  closeModal.addEventListener('click', closeDetailModal);
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeDetailModal();
    }
  });
}

// Slider animation control
let unAcceptClick;
const showSlider = (type) => {
  nextButton.style.pointerEvents = "none";
  prevButton.style.pointerEvents = "none";

  carousel.classList.remove("next", "prev");
  let items = document.querySelectorAll(".carousel .list .item");
  if (type === "next") {
    listHTML.appendChild(items[0]);
    carousel.classList.add("next");
  } else {
    listHTML.prepend(items[items.length - 1]);
    carousel.classList.add("prev");
  }
  clearTimeout(unAcceptClick);
  unAcceptClick = setTimeout(() => {
    nextButton.style.pointerEvents = "auto";
    prevButton.style.pointerEvents = "auto";
  }, 2000);
};

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initCarousel);

// Add a button to refresh Pokemon data
const header = document.querySelector('header');
const refreshButton = document.createElement('button');
refreshButton.innerText = 'Refresh Pokémon';
refreshButton.classList.add('refresh-btn');
refreshButton.addEventListener('click', initCarousel);
header.appendChild(refreshButton);
