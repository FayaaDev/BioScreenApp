# React Native UI Lib Migration Plan

## Overview
This document outlines the plan to complete the migration from standard React Native components to `react-native-ui-lib` components across the BioScreen mobile app.

**Current Status**: Partial migration complete
- ✅ Core components (`View`, `Text`, `Card`, `Button`) migrated in main screens
- ❌ Form inputs, modals, and utility components still using standard RN components

## Migration Phases

### Phase 1: Core Input Components (High Priority)
: 2-3

#### 1.1 TextInput → TextField Migration
Replace all standard `TextInput` components with UI Lib's `TextField`.

**Files to Update**:
- `app/login.tsx` - Login form inputs
- `app/onboarding.tsx` - Registration form inputs
- `app/(tabs)/profile.tsx` - Profile editing inputs
- `app/(tabs)/index.tsx` - Search and filter inputs
- `components/FamilyManagement.tsx` - Family member forms
- `components/PhoneNumberInput.tsx` - Phone number input wrapper

**Benefits**:
- Consistent styling across all inputs
- Built-in validation states
- Better RTL support
- Integrated label and helper text

**Example Migration**:
```tsx
// Before
import { TextInput, StyleSheet } from 'react-native';

<TextInput
  style={styles.input}
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
/>

// After
import { TextField } from 'react-native-ui-lib';

<TextField
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  fieldStyle={styles.input}
/>
```

#### 1.2 TouchableOpacity Enhancement
Ensure all `TouchableOpacity` uses are from UI Lib (not standard RN).

**Files to Update**:
- `components/Collapsible.tsx`
- `components/ScreeningCard.tsx`
- Any remaining imports from `react-native`

**Benefits**:
- Better theming support
- Consistent ripple effects
- Enhanced accessibility

---

### Phase 2: Modal & Overlay Components (High Priority)
: 2-3 

#### 2.1 Modal → UI Lib Modal
Replace standard `Modal` with UI Lib's `Modal` and `Dialog` components.

**Files to Update**:
- `app/onboarding.tsx` - Date picker modal
- `app/(tabs)/profile.tsx` - Edit profile modal
- `app/(tabs)/index.tsx` - Test details modal
- `components/FamilyManagement.tsx` - Add/edit family member modal

**Benefits**:
- Consistent overlay animations
- Better positioning and presentation options
- Built-in backdrop handling
- Enhanced accessibility

**Example Migration**:
```tsx
// Before
import { Modal, View } from 'react-native';

<Modal
  visible={visible}
  transparent
  animationType="slide"
  onRequestClose={onClose}
>
  <View style={styles.modalContainer}>
    {/* Content */}
  </View>
</Modal>

// After
import { Modal } from 'react-native-ui-lib';

<Modal
  visible={visible}
  onDismiss={onClose}
  overlayBackgroundColor="rgba(0,0,0,0.5)"
>
  <View padding-20 bg-white>
    {/* Content */}
  </View>
</Modal>
```

#### 2.2 Tooltip Migration
Replace `react-native-walkthrough-tooltip` with UI Lib's `Hint` component.

**Files to Update**:
- `app/(tabs)/completed-tests.tsx` - Test result tooltips
- `components/TestInputWithTooltip.tsx` - Input tooltips

---

### Phase 3: Picker & Selection Components (Medium Priority)

#### 3.1 Picker → UI Lib Picker
Replace `@react-native-picker/picker` with UI Lib's `Picker`.

**Files to Update**:
- `app/onboarding.tsx` - Governorate/gender selection
- `app/(tabs)/profile.tsx` - Profile field selections
- `components/FamilyManagement.tsx` - Family member relationship selection

**Benefits**:
- Consistent styling with the rest of the app
- Better customization options
- Built-in search functionality
- Modal presentation support

**Example Migration**:
```tsx
// Before
import { Picker } from '@react-native-picker/picker';

<Picker
  selectedValue={value}
  onValueChange={setValue}
>
  <Picker.Item label="Option 1" value="1" />
  <Picker.Item label="Option 2" value="2" />
</Picker>

// After
import { Picker } from 'react-native-ui-lib';

<Picker
  value={value}
  onChange={setValue}
  placeholder="Select option"
>
  {items.map(item => (
    <Picker.Item key={item.value} value={item.value} label={item.label} />
  ))}
</Picker>
```

---

### Phase 4: Loading & Feedback Components (Medium Priority)
: 1-2 

#### 4.1 ActivityIndicator → LoaderScreen
Replace `ActivityIndicator` with UI Lib's `LoaderScreen` for full-screen loading, or keep native for inline loading.

**Files to Update**:
- `app/login.tsx` - Login loading state
- `app/(tabs)/profile.tsx` - Profile loading
- `app/(tabs)/index.tsx` - Data fetching loading
- `app/(tabs)/upcoming-tests.tsx` - Tests loading
- `app/(tabs)/completed-tests.tsx` - Results loading
- `components/FamilyManagement.tsx` - Family data loading

**Decision Points**:
- Full-screen loading: Use `LoaderScreen`
- Inline/button loading: Keep native `ActivityIndicator` or use UI Lib's `Button` with `loading` prop

**Example Migration**:
```tsx
// Before (full-screen)
import { ActivityIndicator, View } from 'react-native';

{loading && (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" />
  </View>
)}

// After (full-screen)
import { LoaderScreen } from 'react-native-ui-lib';

{loading && <LoaderScreen color={Colors.primary} message="Loading..." />}

// For inline loading in buttons
<Button label="Submit" loading={isSubmitting} onPress={handleSubmit} />
```

---

### Phase 5: Layout & Container Components (Low Priority)
: 3-4 

#### 5.1 ScrollView Enhancement
Evaluate if `ScrollView` should use UI Lib's enhanced version or remain native.

**Files to Update**:
- All screen files using `ScrollView`
- `components/FamilyManagement.tsx`

**Note**: UI Lib doesn't have a specific `ScrollView` replacement. Consider wrapping in UI Lib `View` for consistent theming.

#### 5.2 ThemedText & ThemedView Deprecation
Replace custom themed components with direct UI Lib components.

**Files to Update**:
- `app/(tabs)/index.tsx` - Remove `ThemedText`/`ThemedView` imports
- `components/ThemedText.tsx` - Mark as deprecated or remove
- `components/ThemedView.tsx` - Mark as deprecated or remove

**Strategy**:
1. Update all usages to UI Lib's `Text` and `View`
2. Add deprecation warnings to themed components
3. After all usages removed, delete files

---

### Phase 6: Image & Media Components (Low Priority)
: 1 hour

#### 6.1 Image → UI Lib Image
Replace standard `Image` with UI Lib's `Image` for enhanced features.

**Files to Update**:
- `components/ScreeningCard.tsx` - Screening type images

**Benefits**:
- Built-in loading states
- Error handling
- Aspect ratio utilities
- Overlay support

---

### Phase 7: Utility Components (Low Priority)
: 2-3 

#### 7.1 Custom Component Refactoring
Refactor custom components to use UI Lib internally.

**Files to Update**:
- `components/Collapsible.tsx` - Use UI Lib components internally
- `components/ExternalLink.tsx` - Use UI Lib `TouchableOpacity`
- `components/HelloWave.tsx` - Use UI Lib `Text`
- `components/ParallaxScrollView.tsx` - Use UI Lib layouts
- `components/TestInputWithTooltip.tsx` - Use UI Lib form components

---

### Phase 8: Special Cases & Exceptions
**Components to Keep Native**:

These components don't have direct UI Lib equivalents and should remain using native or third-party libraries:

1. **DateTimePicker** (`@react-native-community/datetimepicker`)
   - No UI Lib replacement
   - Well-maintained community package
   - Platform-specific native implementations

2. **Expo Router** Components
   - `Link`, `Tabs`, navigation components
   - Keep as-is, integrate with UI Lib styling

3. **Toast Notifications**
   - Current implementation using `react-native-toast-message`
   - Already customized with `ToastConfig.tsx`
   - Keep current implementation

---

## Testing Strategy

### For Each Phase:

1. **Component-Level Testing**
   - Test all props work correctly
   - Verify styling matches design
   - Check RTL support
   - Validate accessibility

2. **Integration Testing**
   - Test form submissions
   - Verify navigation flows
   - Check data persistence
   - Test error states

3. **Visual Regression Testing**
   - Compare screenshots before/after
   - Test on both iOS and Android
   - Test light and dark modes
   - Test RTL layouts

4. **Performance Testing**
   - Monitor render times
   - Check bundle size impact
   - Test on lower-end devices

---

## Implementation Timeline

### Week 1: High Priority (Phases 1-2)
- **Days 1-2**: TextInput → TextField migration
- **Day 3**: TouchableOpacity cleanup
- **Days 4-5**: Modal components migration

### Week 2: Medium Priority (Phases 3-4)
- **Days 1-2**: Picker components migration
- **Days 3-4**: Loading states migration
- **Day 5**: Testing and bug fixes

### Week 3: Low Priority (Phases 5-7)
- **Days 1-2**: Layout components
- **Day 3**: ThemedText/ThemedView deprecation
- **Day 4**: Image components
- **Day 5**: Utility components refactoring

### Week 4: Polish & Documentation
- **Days 1-2**: Final testing
- **Day 3**: Performance optimization
- **Days 4-5**: Documentation updates

---

## Rollback Plan

For each phase, maintain the ability to rollback:

1. **Use Feature Flags**
   - Create flags for major component changes
   - Allow quick disable if issues arise

2. **Commit Strategy**
   - One commit per file or related group
   - Clear commit messages indicating migration
   - Tag releases after each phase

3. **Backup Components**
   - Keep old components with `.old.tsx` suffix
   - Remove after successful testing

---

## Success Metrics

### Code Quality
- [ ] 100% of target components migrated
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] ESLint compliance

### User Experience
- [ ] No visual regressions
- [ ] Improved accessibility scores
- [ ] Faster render times
- [ ] Reduced bundle size (or justified increase)

### Developer Experience
- [ ] Reduced code duplication
- [ ] Consistent component API
- [ ] Better autocomplete support
- [ ] Improved maintainability

---

## Resources

### Documentation
- [React Native UI Lib Docs](https://wix.github.io/react-native-ui-lib/)
- [UI Library Guide](./UI_LIBRARY_GUIDE.md)
- [Color Quick Reference](./COLOR_QUICK_REFERENCE.md)

### Migration Examples
- [UI Library Integration](./UI_LIBRARY_INTEGRATION.md)
- [UI Library Example](./components/ui/UILibraryExample.tsx)

### Support
- Create issues for blockers
- Document decisions in this file
- Update example components as patterns emerge

---

## Notes & Decisions

### Date: [Current Date]
- Initial migration plan created
- Phases prioritized based on usage frequency and impact

### Future Decisions
- Document any deviations from the plan
- Note any new patterns discovered
- Record performance impacts
