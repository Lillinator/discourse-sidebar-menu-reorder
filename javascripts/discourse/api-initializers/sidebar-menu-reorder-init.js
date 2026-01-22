import { apiInitializer } from "discourse/lib/api";
import { schedule } from "@ember/runloop";

export default apiInitializer("0.11.1", (api) => {
  // Observer instances for tracking DOM changes
  let sidebarObserver = null;      // Watches .sidebar-sections for section changes
  let containerObserver = null;    // Watches app container for sidebar creation/destruction
  let reorderQueued = false;       // Prevents multiple simultaneous reorder operations

  /**
   * Main reordering function that applies flexbox order to sidebar sections
   * based on the sidebar_menu_order setting. Also extracts nested custom sections
   * and makes them direct children of .sidebar-sections for proper ordering.
   */
  function reorderSidebar() {
    reorderQueued = false;

    // Parse the pipe-delimited setting (e.g., "categories|tags|community")
    const desiredOrder = settings.sidebar_menu_order.split('|');
    const totalInOrder = desiredOrder.length;
    const sectionsContainer = document.querySelector('.sidebar-sections');
    if (!sectionsContainer) { return; }

    // Apply flexbox layout to enable CSS order property
    sectionsContainer.style.display = 'flex';
    sectionsContainer.style.flexDirection = 'column';

    // Collect all sections, tracking whether they're direct children or nested
    const allSections = [];
    
    sectionsContainer.querySelectorAll('[data-section-name]').forEach(sectionElement => {
      const sectionName = sectionElement.dataset.sectionName;
      
      // Only process sections explicitly listed in settings
      // Unlisted sections (e.g., user-created private sections) stay in default position
      if (!desiredOrder.includes(sectionName)) {
        return;
      }
      
      // Walk up the DOM tree to find the direct child of sectionsContainer
      // This is needed because custom sections are often nested in wrapper divs
      let flexItem = sectionElement;
      while (flexItem && flexItem.parentElement !== sectionsContainer) {
        flexItem = flexItem.parentElement;
      }
      
      if (flexItem) {
        allSections.push({
          sectionName,
          sectionElement,      // The actual section element with [data-section-name]
          flexItem,            // The direct child of sectionsContainer
          isDirectChild: sectionElement === flexItem  // True if no wrapper exists
        });
      }
    });

    // Apply CSS order values and extract nested sections
    allSections.forEach(({ sectionName, sectionElement, flexItem, isDirectChild }) => {
      const orderIndex = desiredOrder.indexOf(sectionName);
      let calculatedOrder = 99;  // Default order for sections not in settings list
      
      // Use negative orders so sections appear before any default-ordered items
      // Example: if totalInOrder is 3 and orderIndex is 0, calculatedOrder = -3
      if (orderIndex !== -1) {
        calculatedOrder = orderIndex - totalInOrder;
      }

      if (isDirectChild) {
        // Section is already a direct child, just apply order
        flexItem.style.setProperty('order', calculatedOrder, 'important');
      } else {
        // Section is nested (likely a custom section), extract it and make it a direct child
        // This allows custom sections to be ordered alongside default sections
        if (sectionElement.parentElement !== sectionsContainer) {
          sectionsContainer.appendChild(sectionElement);
        }
        sectionElement.style.setProperty('order', calculatedOrder, 'important');
        
        // Add visual separator border to extracted custom sections
        // (CSS removes this from the last child via :last-child selector)
        sectionElement.style.borderBottom = '1px solid var(--d-sidebar-section-border-color)';
      }
    });
  }

  /**
   * Queues a reorder operation using requestAnimationFrame to batch multiple
   * rapid changes (e.g., during initial render) into a single reorder pass.
   */
  function queueReorder() {
    if (!reorderQueued) {
      reorderQueued = true;
      window.requestAnimationFrame(reorderSidebar);
    }
  }

  /**
   * Sets up a MutationObserver on .sidebar-sections to watch for:
   * - New sections being added
   * - Sections being removed
   * - Section attributes changing (class, style)
   * 
   * This catches most sidebar changes but misses the sidebar being destroyed/recreated.
   */
  function setupObserver() {
    const sectionsContainer = document.querySelector('.sidebar-sections');
    if (!sectionsContainer) {
      // Sidebar not ready yet, retry in 50ms
      setTimeout(setupObserver, 50);
      return;
    }

    // Disconnect existing observer to avoid duplicates
    if (sidebarObserver) {
      sidebarObserver.disconnect();
    }
    
    sidebarObserver = new MutationObserver(queueReorder);
    sidebarObserver.observe(sectionsContainer, {
      childList: true,           // Watch for sections added/removed
      subtree: true,             // Watch nested elements (for custom sections)
      attributes: true,          // Watch attribute changes
      attributeFilter: ['class', 'style']  // Only care about class/style changes
    });

    // Trigger initial reorder
    queueReorder();
  }

  /**
   * Sets up a higher-level MutationObserver on the app container to detect
   * when the entire sidebar is created or destroyed (e.g., on collapse/expand).
   * 
   * This solves the issue where collapsing and expanding the sidebar would
   * reset sections to default order, as Discourse recreates the sidebar DOM.
   */
  function setupContainerObserver() {
    // Watch the main outlet or fall back to body
    const appContainer = document.querySelector('#main-outlet-wrapper') || document.body;
    
    if (containerObserver) {
      containerObserver.disconnect();
    }
    
    containerObserver = new MutationObserver(() => {
      // Check if sidebar exists and set up section-level observer
      const sectionsContainer = document.querySelector('.sidebar-sections');
      if (sectionsContainer) {
        setupObserver();
      }
    });
    
    containerObserver.observe(appContainer, {
      childList: true,  // Watch for sidebar being added/removed
      subtree: true     // Watch deeply nested changes
    });
    
    // If sidebar already exists on init, set up immediately
    if (document.querySelector('.sidebar-sections')) {
      setupObserver();
    }
  }

  // Re-setup observers when navigating to a new page (Discourse is a SPA)
  api.onAppEvent('page:changed', () => {
    schedule('afterRender', setupObserver);
  });

  // Initial setup after Ember's render cycle completes
  schedule('afterRender', setupContainerObserver);
});
