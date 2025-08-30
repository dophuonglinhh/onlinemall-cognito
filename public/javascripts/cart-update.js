// Cart Update Functionality
function updateCartCount(newCount) {
  // Update desktop cart badge
  const desktopBadge = document.querySelector('.cart-count-badge');
  const desktopCartLink = document.querySelector('.cart-icon-link');
  
  // Update mobile cart badge
  const mobileBadge = document.querySelector('.cart-badge');
  
  if (newCount > 0) {
    // Show badges with new count
    if (desktopBadge) {
      desktopBadge.textContent = newCount;
      desktopBadge.style.display = 'flex';
    } else if (desktopCartLink) {
      // Create badge if it doesn't exist
      const badge = document.createElement('span');
      badge.className = 'cart-count-badge';
      badge.textContent = newCount;
      desktopCartLink.appendChild(badge);
    }
    
    if (mobileBadge) {
      mobileBadge.textContent = newCount;
      mobileBadge.style.display = 'flex';
    }
  } else {
    // Hide badges when count is 0
    if (desktopBadge) {
      desktopBadge.style.display = 'none';
    }
    if (mobileBadge) {
      mobileBadge.style.display = 'none';
    }
  }
}

// Function to fetch current cart count from server
async function refreshCartCount() {
  try {
    const response = await fetch('/api/cart/count');
    if (response.ok) {
      const data = await response.json();
      updateCartCount(data.count);
    }
  } catch (error) {
    console.error('Error refreshing cart count:', error);
  }
}

// Add event listeners for cart updates
document.addEventListener('DOMContentLoaded', function() {
  // Listen for cart update events
  document.addEventListener('cartUpdated', function(event) {
    if (event.detail && typeof event.detail.count === 'number') {
      updateCartCount(event.detail.count);
    } else {
      refreshCartCount();
    }
  });
  
  // Add animation when cart count changes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const badge = mutation.target.closest('.cart-count-badge, .cart-badge');
        if (badge) {
          badge.style.transform = 'scale(1.2)';
          setTimeout(() => {
            badge.style.transform = 'scale(1)';
          }, 200);
        }
      }
    });
  });
  
  // Observe cart badges for changes
  const badges = document.querySelectorAll('.cart-count-badge, .cart-badge');
  badges.forEach(badge => {
    observer.observe(badge, { 
      childList: true, 
      characterData: true, 
      subtree: true 
    });
  });
});

// Global function to trigger cart update
window.triggerCartUpdate = function(newCount) {
  const event = new CustomEvent('cartUpdated', { 
    detail: { count: newCount } 
  });
  document.dispatchEvent(event);
};