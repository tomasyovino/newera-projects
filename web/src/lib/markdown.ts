import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';
import rehypeStringify from 'rehype-stringify';

const schema: Schema = {
    ...defaultSchema,
    attributes: {
        ...(defaultSchema.attributes || {}),
        a: [
            ...(defaultSchema.attributes?.a || []),
            'target',
            'rel',
        ],
        img: [
            ...(defaultSchema.attributes?.img || []),
            'className',
            'loading',
            ['decoding', 'async', 'auto', 'sync'],
        ],
    },
};

export async function renderMarkdown(md: string): Promise<string> {
    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: false })
        .use(rehypeExternalLinks, { target: '_blank', rel: ['noreferrer', 'noopener'] })
        .use(rehypeSanitize, schema)
        .use(rehypeStringify)
        .process(md || '');
    return String(file);
}
