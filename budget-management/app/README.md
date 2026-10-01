# Everyday app

See [the project guide](../README.md) for launch, storage and recovery instructions.

Build: `node build.cjs`

Check: `node --test tests/*.test.cjs`

`src/core.js` preserves the original allocation and carry-forward rules. `src/domain.js` contains new pure operations. `src/product.js`, `src/product-dialogs.js` and `src/product.css` provide the new interface. `server-v2.cjs` serves the loopback app and writes versioned local snapshots.
