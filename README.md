# Discourse Sidebar Menu Reorder

## Overview
This Discourse theme component lets administators reorder their forum's sidebar menu sections, including all the default sections as well as any custom global sections.  The component works for both desktop and mobile sidebar views.

## Installation & Configuration
- Install this theme component as per [Beginner’s guide to using Discourse Themes](https://meta.discourse.org/t/beginners-guide-to-using-discourse-themes/91966).
- The `community` section refers to the default top section of the sidebar - the menu with the **Topics** header and includes the **More** dropdown submenu; it is recommended that more more than one or two sections (default or custom) be moved above the `community` section.  
- Do not delete any of the default sections in the setting or they will be out of order (you can always add them back or reset the setting).   
- The best way to set this component up is to have the component admin screen with the reorder list setting in one browser window, and the forum siderbar view as a test user in another one beside it; reload the page after every menu section order change in the list.  

## Notes
- After adding new global custom sections to the sidebar_menu_order setting, users may need to refresh their page or collapse/expand the sidebar to see the correct ordering.
- User-created custom menu sections will always appear at the bottom part of the sidebar for that user.
- If the `Admin -> All_site_settings -> Chat_separate_sidebar_mode` setting is set to `Always`, the chat button will appear as usual at the bottom and the component will ignore the default chat menu sections (`chat-dms`, `chat-channels` and `chat-search`).

---
**Discourse Meta Topic**: https://meta.discourse.org/t/discourse-sidebar-menu-reorder/394049

**Support**: For issues or feature requests, please post in the [Meta topic](https://meta.discourse.org/t/discourse-sidebar-menu-reorder/394049) or start a PR on this repo.  

**To hire me or buy me coffee**: visit me here: [Lilly@Discourse Meta](https://meta.discourse.org/u/Lilly/summary).
