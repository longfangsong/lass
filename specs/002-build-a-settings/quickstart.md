# Quickstart: Settings Page Validation

## Overview
This quickstart provides step-by-step validation scenarios for the Settings Page feature. Each scenario corresponds to the acceptance criteria defined in the feature specification.

## Prerequisites
- Development server running (`pnpm run dev`)
- Browser with developer tools access
- Clean localStorage state (or known initial settings)

## Test Scenarios

### Scenario 1: Settings Page Navigation
**Acceptance Criteria**: FR-001 - System MUST provide a dedicated settings page accessible from the main navigation

**Steps**:
1. Open Läss in browser (http://localhost:5173)
2. Look for "Settings" link/button in main navigation
3. Click on Settings navigation item
4. Verify URL changes to `/settings`
5. Verify settings page loads with settings form

**Expected Result**: 
- Settings page accessible via navigation
- URL routing works correctly
- Page loads without errors

**Validation**:
```bash
# Check browser console for any errors
# Verify network tab shows no failed requests
# Confirm page title/heading indicates settings
```

---

### Scenario 2: Theme Configuration
**Acceptance Criteria**: FR-002, FR-006 - Theme selection and immediate application

**Steps**:
1. Navigate to Settings page
2. Locate theme selector (dropdown/radio buttons)
3. Note current theme (light/dark)
4. Change theme to different option (e.g., dark → light)
5. Observe immediate theme change in UI
6. Refresh page and verify theme persists

**Expected Result**:
- Theme changes immediately without page refresh
- UI colors/styling update correctly
- Theme preference persists after refresh

**Validation**:
```bash
# Check localStorage["vite-ui-theme"] value
# Verify document.documentElement classes change
# Confirm CSS custom properties update
```

---

### Scenario 3: Daily Review Count Configuration  
**Acceptance Criteria**: FR-003, FR-008, FR-012 - Configure daily review limits with validation

**Steps**:
1. Navigate to Settings page
2. Locate "Daily Review Count" input field
3. Note current value (should default to reasonable number)
4. Change value to 15
5. Save settings
6. Navigate to wordbook/review page
7. Verify review limit affects review system behavior

**Expected Result**:
- Input accepts valid numbers
- Setting saves successfully  
- Review system respects the new limit

**Validation**:
```bash
# Check localStorage["user-settings"] for updated value
# Test review system with new limit
# Verify form validation for invalid inputs
```

---

### Scenario 4: Notification Settings
**Acceptance Criteria**: FR-004, FR-005, FR-013, FR-014 - PWA notification configuration

**Steps**:
1. Navigate to Settings page
2. Locate notification toggle/checkbox
3. Note current notification permission status display
4. Enable notifications (if currently disabled)
5. Verify browser permission request appears
6. Grant permission in browser dialog
7. Verify permission status updates in UI
8. Save settings

**Expected Result**:
- Permission request triggered when enabling notifications
- Permission status accurately displayed
- Settings reflect notification preference

**Validation**:
```bash
# Check Notification.permission value in console
# Verify localStorage["user-settings"] notification flags
# Test with denied permissions scenario
```

---

### Scenario 5: Form Validation
**Acceptance Criteria**: FR-008 - Input validation for invalid values

**Steps**:
1. Navigate to Settings page
2. Try to enter invalid daily review count:
   - Negative number (-5)
   - Zero (0)  
   - Very large number (999)
   - Non-numeric text ("abc")
3. Attempt to save form
4. Verify validation errors appear
5. Enter valid value (20)
6. Verify validation clears and save succeeds

**Expected Result**:
- Invalid inputs show validation errors
- Form prevents saving with invalid data
- Valid inputs allow successful save
- Error messages are user-friendly

**Validation**:
```bash
# Check form validation triggers
# Verify error messages display correctly
# Confirm invalid data doesn't reach localStorage
```

---

### Scenario 6: Settings Persistence
**Acceptance Criteria**: FR-007, FR-009, FR-010 - Settings storage and feedback

**Steps**:
1. Navigate to Settings page
2. Make multiple changes:
   - Change theme to "system"
   - Set daily review count to 25
   - Enable notifications (if supported)
3. Save settings
4. Verify success feedback appears
5. Close browser/tab completely
6. Reopen Läss application
7. Navigate to Settings page
8. Verify all settings are preserved

**Expected Result**:
- Success message shows after saving
- All settings persist across browser sessions
- Settings page loads with saved values

**Validation**:
```bash
# Check localStorage persistence after browser restart
# Verify settings load correctly on page refresh
# Confirm success feedback UI appears
```

---

### Scenario 7: Browser Compatibility
**Acceptance Criteria**: FR-013 - Handle browsers without notification support

**Steps**:
1. Test in browser without notification support (if available)
2. Navigate to Settings page
3. Locate notification section
4. Verify appropriate message/disabled state
5. Attempt to enable notifications
6. Verify graceful handling

**Expected Result**:
- Unsupported browsers show appropriate messaging
- Notification options are disabled/hidden when unsupported
- No JavaScript errors occur

**Validation**:
```bash
# Test in different browsers (Chrome, Firefox, Safari)
# Check console for feature detection logic
# Verify graceful degradation
```

---

### Scenario 8: Error Handling
**Acceptance Criteria**: FR-011 - Graceful error handling

**Steps**:
1. Navigate to Settings page
2. Simulate storage error by filling localStorage quota:
   ```javascript
   // In browser console
   try {
     for(let i = 0; i < 1000; i++) {
       localStorage.setItem('test' + i, 'x'.repeat(100000));
     }
   } catch(e) { console.log('Storage full'); }
   ```
3. Try to save settings
4. Verify error message appears
5. Clear test data and retry
6. Verify settings save succeeds

**Expected Result**:
- Storage errors show user-friendly messages
- Application doesn't crash on storage failures
- Recovery is possible after resolving storage issues

**Validation**:
```bash
# Simulate various error conditions
# Verify error boundaries work correctly
# Check error logging and reporting
```

---

## Integration Testing

### Theme Integration Test
1. Change theme in Settings page
2. Navigate to other pages (Dictionary, Articles, Wordbook)
3. Verify theme applies consistently across all pages
4. Use existing theme toggle (if available)
5. Verify Settings page reflects external theme changes

### Review System Integration Test
1. Set daily review count to 5 in Settings
2. Navigate to Review page
3. Add multiple words to review queue
4. Verify review system respects the 5-word daily limit
5. Check review statistics show correct limits

### Offline Testing
1. Enable offline mode in browser dev tools
2. Navigate to Settings page
3. Modify settings and save
4. Verify settings persist in localStorage
5. Re-enable network
6. Verify settings remain unchanged

## Performance Validation

### Load Performance
- Settings page should load within 200ms
- No unnecessary network requests
- Minimal layout shift during loading

### Save Performance  
- Settings save should complete within 100ms
- No blocking UI operations
- Immediate feedback to user

### Memory Usage
- No memory leaks in settings components
- Clean component unmounting
- Efficient form state management

## Success Criteria

✅ **All 8 test scenarios pass without errors**  
✅ **Integration tests demonstrate cross-component compatibility**  
✅ **Performance benchmarks meet targets**  
✅ **Error handling prevents application crashes**  
✅ **Accessibility features work correctly**  
✅ **Mobile responsive design validated**

## Troubleshooting

### Common Issues
- **localStorage unavailable**: Check browser privacy settings
- **Notifications not working**: Verify HTTPS and browser support
- **Theme not updating**: Clear localStorage and restart browser  
- **Form validation errors**: Check console for detailed error messages

### Debug Commands
```bash
# Check current settings in localStorage
console.log(JSON.parse(localStorage.getItem('user-settings')));

# Verify notification support
console.log('Notification' in window);
console.log(Notification.permission);

# Check theme state
console.log(localStorage.getItem('vite-ui-theme'));
console.log(document.documentElement.classList);
```