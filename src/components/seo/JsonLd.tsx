/**
 * A schema.org block, as a <script type="application/ld+json">.
 *
 * There is no React way to put JSON inside a script tag — children get escaped
 * into HTML entities and the result is not parseable JSON — so this is
 * `dangerouslySetInnerHTML`, which is the documented approach and why this is
 * one shared component rather than the same three lines in four pages.
 *
 * `<` IS ESCAPED TO < ON THE WAY OUT. JSON.stringify does not escape it,
 * so a string containing `</script>` anywhere in the payload closes the tag
 * early and everything after it is parsed as markup. Today the payload is a
 * post title out of the repo's own frontmatter, so this is theoretical; the
 * point is that it stops being theoretical the moment anything here is fed by
 * something other than a file a human committed, and < is a valid JSON
 * escape that every parser reads back as `<`.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
