# 🎨 Color System Quick Reference

## Unified Color System
Your project now has **one color system** that works across web and mobile!

---

## 📱 Mobile (React Native UI Library)

### Import
```tsx
import { View, Text, Button, Colors } from 'react-native-ui-lib';
```

### Usage
```tsx
// Using string color names (recommended)
<View backgroundColor="primary" padding-s4>
  <Text h1 color="text">Title</Text>
  <Text body color="textSecondary">Description</Text>
  <Button label="Action" backgroundColor="primary" />
</View>

// Or using Color object directly
<View style={{ backgroundColor: Colors.primary }}>
  <Text style={{ color: Colors.text }}>Content</Text>
</View>
```

---

## 🌐 Web (Tailwind CSS)

### Usage
```tsx
<div className="bg-zimam-primary text-white p-4">
  <h1 className="text-2xl">Title</h1>
  <p className="text-zimam-100">Description</p>
  <button className="bg-zimam-primary">Action</button>
</div>
```

---

## 🎯 Available Colors

### Primary Colors
| Name | Mobile | Web | Hex |
|------|--------|-----|-----|
| Primary | `primary` | `zimam-primary` | #4CCCE6 |
| Shade 1 | `primary70` | `zimam-100` | #23AFD0 |
| Shade 2 | `primary60` | `zimam-200` | #00A2C7 |
| Shade 3 | `primary50` | `zimam-300` | #11809C |
| Shade 4 | `primary40` | `zimam-400` | #12677E |
| Shade 5 | `primary30` | `zimam-500` | #045468 |
| Shade 6 | `primary20` | `zimam-600` | #003848 |
| Shade 7 | `primary10` | `zimam-700` | #004558 |

### Secondary Colors
| Name | Mobile | Web | Hex |
|------|--------|-----|-----|
| Secondary | `secondary` | `zimamdark-primary` | #202221 |
| Secondary Light | `secondary20` | `zimamdark-secondary` | #272A29 |

### Semantic Colors
| Name | Mobile | Web | Hex |
|------|--------|-----|-----|
| Success | `success` | - | #10b981 |
| Error | `error` | - | #ef4444 |
| Warning | `warning` | - | #f59e0b |
| Info | `info` | - | #4CCCE6 |

### UI Colors
| Name | Mobile | Hex |
|------|--------|-----|
| Background | `background` | #202221 (light) / #151718 (dark) |
| Surface/Card | `card` | #2E3130 (light) / #1e293b (dark) |
| Text | `text` | #ECEDEE |
| Text Secondary | `textSecondary` | #94a3b8 |
| Icon | `icon` | #9BA1A6 |

---

## 🚀 Quick Examples

### Mobile Button
```tsx
<Button label="Submit" backgroundColor="primary" />
<Button label="Cancel" backgroundColor="secondary" />
<Button label="Delete" backgroundColor="error" />
```

### Mobile Card
```tsx
<Card backgroundColor="card" padding-s4>
  <Text h3 color="text">Card Title</Text>
  <Text body color="textSecondary">Card description</Text>
</Card>
```

### Web Button
```tsx
<button className="bg-zimam-primary text-white px-4 py-2 rounded">
  Submit
</button>
```

### Web Card
```tsx
<div className="bg-card p-4 rounded-lg">
  <h3 className="text-xl text-white">Card Title</h3>
  <p className="text-gray-400">Card description</p>
</div>
```

---

## 📦 Spacing System (Mobile)

Use these modifiers for consistent spacing:
- `padding-s2` = 8px
- `padding-s4` = 16px
- `padding-s6` = 24px
- `marginB-s3` = bottom margin 12px
- `marginH-s5` = horizontal margin 20px

Example:
```tsx
<View padding-s4 marginB-s3>
  <Text>Content with spacing</Text>
</View>
```

---

## 📚 Documentation

- **Mobile**: See `/BioScreenMobile/UI_LIBRARY_GUIDE.md`
- **Migration**: See `/BioScreenMobile/COLOR_MIGRATION_GUIDE.md`
- **Examples**: See `/BioScreenMobile/components/ui/UILibraryExample.tsx`

---

## ⚡ Pro Tips

1. **Consistency**: Same colors everywhere = better UX
2. **Type Safety**: Use string names for autocomplete
3. **Spacing**: Use modifiers (s1-s10) instead of hard-coded values
4. **Typography**: Use `h1`, `h2`, `body`, etc. instead of custom styles
5. **Gradual Migration**: You don't need to update everything at once!
