# Oiga
## Opt-int Google Analytics

For the complete documentation and examples: http://oiga.nexthtml.nl/ or see the index.html

# Example

Replace the Google Analytics tracking snippet with this snippet. Replace UA-XXXXXXX-X with your
tracking id.

```html
<script async src="https://storage.googleapis.com/mostwantit/assets/Oiga/oiga/oiga.min.js"></script>
<script>
    var trackingId = 'UA-XXXXXXX-X';
    window.oigaLayer = window.oigaLayer || [];
    function oiga(){oigaLayer.push(arguments);};
    oiga('optin', trackingId);
    oiga('js', new Date());
    oiga('config', trackingId, { 'anonymize_ip': true });
</script>
```

Include this stylesheet or style the bar yourself. If you do not use the bar you don't need it.

```html
<link rel="stylesheet" href="https://storage.googleapis.com/mostwantit/assets/Oiga/oiga/oiga.css" />
```

`oigaLayer` and `oiga` can be used instead of `dataLayer` and `gtag` to make sure no events are tracked before consent. For example to track an add to cart event:

```javascript
oiga('event', 'add_to_cart', { items: [{ 'id': '525', name: 'Rubber Duck', brand: 'Abc Toys', 'price': '€ 4,50' }] });
```
