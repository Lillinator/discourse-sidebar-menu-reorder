import { acceptance } from "discourse/tests/helpers/qunit-helpers";
import { test } from "qunit";
import { visit } from "@ember/test-helpers";

acceptance("Sidebar Menu Reorder", function (needs) {
  needs.user();
  needs.settings({
    sidebar_menu_order: "tags|community|categories"
  });

  test("reorders sidebar sections according to settings", async function (assert) {
    await visit("/");

    const sectionsContainer = document.querySelector('.sidebar-sections');
    assert.ok(sectionsContainer, "sidebar sections container exists");

    const sections = sectionsContainer.querySelectorAll('[data-section-name]');
    assert.ok(sections.length > 0, "sidebar has sections");

    // Get the visual order of sections
    const sectionElements = Array.from(sections).map(el => ({
      name: el.dataset.sectionName,
      order: parseInt(window.getComputedStyle(el.parentElement || el).order || 0)
    }));

    // Tags should have the lowest (most negative) order
    const tagsSection = sectionElements.find(s => s.name === 'tags');
    const communitySection = sectionElements.find(s => s.name === 'community');
    const categoriesSection = sectionElements.find(s => s.name === 'categories');

    if (tagsSection && communitySection) {
      assert.ok(
        tagsSection.order < communitySection.order,
        "tags appears before community"
      );
    }

    if (communitySection && categoriesSection) {
      assert.ok(
        communitySection.order < categoriesSection.order,
        "community appears before categories"
      );
    }
  });

  test("extracts and reorders custom sections", async function (assert) {
    await visit("/");

    const sectionsContainer = document.querySelector('.sidebar-sections');
    const customSections = Array.from(sectionsContainer.querySelectorAll('[data-section-name]'))
      .filter(el => {
        const name = el.dataset.sectionName;
        return !['community', 'categories', 'tags', 'chat-channels', 'chat-dms', 'chat-search'].includes(name);
      });

    customSections.forEach(customSection => {
      // Check that custom section is a direct child of sectionsContainer or has order applied
      const hasOrder = customSection.style.order !== '';
      assert.ok(hasOrder, `custom section ${customSection.dataset.sectionName} has order applied`);

      // Check that custom section has border
      const hasBorder = window.getComputedStyle(customSection).borderBottom !== 'none';
      assert.ok(hasBorder, `custom section ${customSection.dataset.sectionName} has border`);
    });
  });

  test("applies flexbox layout to sidebar sections", async function (assert) {
    await visit("/");

    const sectionsContainer = document.querySelector('.sidebar-sections');
    const displayStyle = window.getComputedStyle(sectionsContainer).display;
    const flexDirection = window.getComputedStyle(sectionsContainer).flexDirection;

    assert.equal(displayStyle, 'flex', "sidebar sections uses flex display");
    assert.equal(flexDirection, 'column', "sidebar sections uses column direction");
  });
  test("maintains order after sidebar collapse and expand", async function (assert) {
    await visit("/");

    const sectionsContainer = document.querySelector('.sidebar-sections');
  
  // Get initial order
    const initialSections = Array.from(sectionsContainer.querySelectorAll('[data-section-name]')).map(el => ({
      name: el.dataset.sectionName,
      order: parseInt(window.getComputedStyle(el.parentElement || el).order || 0)
    }));

  // Simulate sidebar collapse/expand by triggering the toggle
    const toggleButton = document.querySelector('.sidebar-toggle');
      if (toggleButton) {
        await click(toggleButton); // Collapse
        await click(toggleButton); // Expand
      }

  // Get order after toggle
    const afterSections = Array.from(sectionsContainer.querySelectorAll('[data-section-name]')).map(el => ({
      name: el.dataset.sectionName,
      order: parseInt(window.getComputedStyle(el.parentElement || el).order || 0)
    }));

    assert.deepEqual(afterSections, initialSections, "section order persists after sidebar toggle");
  });
});
