const MarkdownDescription = ({ children }: { children: React.ReactNode }) => {
  const markdownLinkRegex = /(\[[^\]]*\]\(https?:\/\/[^)]*\))/g;
  const tempString = children.toString().replace(markdownLinkRegex, ':::::$1:::::');

  return (
    <p style={{ whiteSpace: 'pre-wrap' }}>
      {tempString.split(':::::').map((part, index) =>
        markdownLinkRegex.test(part) ? (
          <a key={index} href={/\((https?:\/\/[^)]*)\)/.exec(part)[1]} target="_blank">
            {/\[([^\]]*)\]/.exec(part)[1]}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
};

export default MarkdownDescription;
