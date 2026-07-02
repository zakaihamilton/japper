export const TEXTAREA_FILE_LIMIT = 10 * 1024 * 1024;
export const OUTPUT_PREVIEW_LIMIT = 5 * 1024 * 1024;

export const SAMPLE_JSON = JSON.stringify(
    [
        {
            id: 101,
            product: 'Mechanical Keyboard',
            price: 120.5,
            tags: ['electronics', 'office'],
            stock: { warehouse: 50, retail: 12 },
        },
        {
            id: 102,
            product: 'Gaming Mouse',
            price: 59.99,
            tags: ['electronics', 'gaming'],
            stock: { warehouse: 100, retail: 25 },
        },
    ],
    null,
    2,
);

export const SAMPLE_TEMPLATE = `<item id="{{id}}">
  <name>{{product}}</name>
  <price currency="USD">{{price}}</price>
  <inventory total="{{stock.warehouse}}"/>
</item>`;
