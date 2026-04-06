# Test: UIScrollbar2D Component

## Test cases

Derived from the acceptance criteria in `requirement.md` and design in `02_design.md`.

### ScrollbarModel (unit tests) — `scrollbar2d-model.test.ts`

### Case 1: Construction stores initial values and clamps out-of-range
- **Input:** min=0, max=100, value=150
- **Expected:** value is clamped to 100
- **Type:** unit

### Case 2: setValue clamps to min/max
- **Input:** setValue(200) on range [0, 100]
- **Expected:** returns 100, value is 100
- **Type:** unit

### Case 3: stepForward/stepBackward increment/decrement by step
- **Input:** value=0, step=5 → stepForward()
- **Expected:** value becomes 5
- **Type:** unit

### Case 4: pageForward/pageBackward increment/decrement by pageStep
- **Input:** value=0, pageStep=10 → pageForward()
- **Expected:** value becomes 10
- **Type:** unit

### Case 5: thumbSize is proportional to visibleSize/contentSize
- **Input:** visibleSize=25, range=100, trackLength=200
- **Expected:** thumbSize = 40
- **Type:** unit

### Case 6: thumbSize has 20px minimum
- **Input:** visibleSize=1, range=1000, trackLength=200
- **Expected:** thumbSize = 20
- **Type:** unit

### Case 7: thumbPosition is 0 at min, (trackLength - thumbSize) at max
- **Input:** value=0 then value=max
- **Expected:** position=0, then position=trackLength-thumbSize
- **Type:** unit

### Case 8: setFromThumbPosition maps position to value
- **Input:** position at midpoint of available range
- **Expected:** value ≈ 50 (for range 0–100)
- **Type:** unit

### Case 9: Edge case — min === max
- **Input:** min=50, max=50
- **Expected:** value=50, step operations return 50, thumbPosition=0
- **Type:** unit

---

### UIScrollbar2DWC (scene graph tests) — `scrollbar2d-wc.test.ts`

### Case 10: Element sets display:block, overflow:hidden, tabindex on connect
- **Input:** append to DOM
- **Expected:** style.display=block, overflow=hidden, tabindex="0"
- **Type:** integration

### Case 11: Creates Konva canvas inside element
- **Input:** configure + append to DOM
- **Expected:** querySelector('canvas') is truthy
- **Type:** integration

### Case 12: Vertical back button at top, forward button at bottom
- **Input:** kind='both', barSize=16, height=300
- **Expected:** vBackBtn.y()=0, vFwdBtn.y()=300-16-16
- **Type:** integration

### Case 13: Vertical thumb within track bounds
- **Input:** default values
- **Expected:** thumb.y >= track.y, thumb.y+thumb.h <= track.y+track.h
- **Type:** integration

### Case 14: Vertical thumb size proportional to visibleSize
- **Input:** visibleSize=25, range=100
- **Expected:** thumb.height / track.height ≈ 0.2
- **Type:** integration

### Case 15: Thumb moves when value changes
- **Input:** vValue=0 → vValue=50
- **Expected:** thumb.y increases
- **Type:** integration

### Case 16: Horizontal layout — back at left, forward at right, thumb in bounds
- **Input:** kind='both', barSize=16, width=300
- **Expected:** hBackBtn.x()=0, hFwdBtn.x()=300-16-16
- **Type:** integration

### Case 17: No overlap between buttons and track
- **Input:** default layout
- **Expected:** backBtn edge <= track edge, track edge <= fwdBtn edge
- **Type:** integration

### Case 18: sb2d-change event fires on value change with correct detail
- **Input:** set vValue=42
- **Expected:** event.detail = { axis:'vertical', value:42, previousValue:0 }
- **Type:** integration

### Case 19: No event when value does not change
- **Input:** set vValue=50 when already 50
- **Expected:** no event fired
- **Type:** integration

### Case 20: destroy removes canvas
- **Input:** call destroy()
- **Expected:** querySelector('canvas') is null
- **Type:** integration

### Case 21: setVerticalRange/setHorizontalRange recalculates thumb
- **Input:** change range from 100 to 500
- **Expected:** thumb size decreases
- **Type:** integration

### Case 22: setVerticalRange clamps current value
- **Input:** vValue=80, then setVerticalRange(0, 50, 25)
- **Expected:** vValue <= 50
- **Type:** integration

## Edge cases

- min === max → no movement, thumb at 0
- trackLength === 0 → thumbSize = 20 (minimum), position = 0
- visibleSize > contentSize → thumb fills track
- value set beyond range → clamped

## Results

| Case | Status | Date |
|------|--------|------|
| Case 1–9 | pending | - |
| Case 10–22 | pending | - |
