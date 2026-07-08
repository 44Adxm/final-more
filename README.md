# El Paso Menu Site

Moderná prezentačná stránka reštaurácie s jednoduchou správou týždenného menu.

## Spustenie

```bash
npm start
```

Stránka beží na:

- `http://localhost:3000`
- správa menu: `http://localhost:3000/admin.html`

Vývojové heslo do správy menu je `elpaso2026`.

## Produkčné heslo

Pred reálnym nasadením nastav vlastné heslo cez premennú prostredia:

```bash
ADMIN_PASSWORD="silne-heslo" npm start
```

Menu sa ukladá do `data/menu.json`.
