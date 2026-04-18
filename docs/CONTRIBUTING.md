# Contributing to JSON Formatter

Thank you for your interest in contributing! We welcome all contributions from the community.

## 🎯 How to Contribute

### 1. Report Bugs
Found a bug? Please create an issue with:
- Bug description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser/OS information

### 2. Suggest Features
Have an idea? Please:
- Search existing issues first
- Describe the feature clearly
- Explain why it would be useful
- Provide examples if possible

### 3. Submit Code Changes

#### Prerequisites
- GitHub account
- Git installed locally
- Text editor (VS Code recommended)

#### Process
1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/json-formatter.git
   cd json-formatter
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Keep code clean and readable
   - Follow existing code style
   - Add comments for complex logic
   - Test thoroughly

4. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of changes"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Describe changes clearly
   - Reference related issues
   - Wait for review and feedback

## 📋 Code Style Guidelines

### JavaScript
```javascript
// Use clear variable names
let inputJSON = document.getElementById('inputJSON');

// Use arrow functions
const formatData = (data) => {
    return JSON.stringify(data, null, 2);
};

// Add comments for complex logic
// Validate JSON before formatting
if (validateJSON(input)) {
    // Process...
}
```

### HTML
```html
<!-- Use semantic HTML -->
<section class="formatter-section">
    <h2>JSON Formatter</h2>
    <textarea id="inputJSON"></textarea>
</section>

<!-- Use data attributes for JavaScript -->
<button id="formatBtn" data-action="format">Format</button>
```

### CSS
```css
/* Use meaningful class names */
.formatter-section {
    margin: 20px 0;
}

/* Group related properties */
.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
}

/* Mobile first approach */
@media (max-width: 768px) {
    .formatter-section {
        margin: 10px 0;
    }
}
```

## 🧪 Testing

Before submitting changes:
1. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
2. Test on mobile devices
3. Verify dark mode works
4. Check for console errors
5. Validate HTML/CSS

## 📚 Documentation

When adding features:
1. Update README.md
2. Add code comments
3. Update relevant documentation files
4. Include usage examples

## 🐛 Commit Message Format

Use clear, descriptive commit messages:

```
Add: Add new feature description
Fix: Fix bug description
Update: Update feature description
Docs: Update documentation
Style: Code style changes
Refactor: Code refactoring without behavior changes
Test: Add/update tests
```

## 🎓 Getting Help

- Check existing issues and discussions
- Read the README.md thoroughly
- Review the code structure
- Ask questions in issues

## ✅ PR Review Checklist

Before submitting a PR, ensure:
- [ ] Code follows style guidelines
- [ ] Changes are tested
- [ ] Documentation is updated
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility considered
- [ ] Performance optimized

## 🚀 Release Process

Contributors who've made significant contributions may:
1. Discuss feature releases
2. Help with version bumps
3. Review PRs from others
4. Participate in planning

## 📞 Contact

- Issues: GitHub Issues
- Email: support@your-domain.com
- Twitter: @your-handle

## 📖 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Help](https://docs.github.com/)
- [JavaScript Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Web Accessibility](https://www.w3.org/WAI/)

---

**Thank you for contributing!** ❤️

Your efforts help make JSON Formatter better for everyone.
