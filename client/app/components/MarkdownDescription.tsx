type Props = {
  children: React.ReactNode;
};

const MarkdownDescription = ({ children }: Props) => {
  const markdownLinkRegex = /(\[[^\]]*\]\(https?:\/\/[^)]*\))/g;
  const tempString = (children as any).toString().replace(
    markdownLinkRegex,
    ':::::$1:::::',
  );

  return (
    <p style={{ whiteSpace: 'pre-wrap' }}>
      {tempString.split(':::::').map((part: string, index: number) =>
        markdownLinkRegex.test(part)
          ? (
            // target="_blank" doesn't work when added to this a tag, for some reason
            <a key={index} href={/\((https?:\/\/[^)]*)\)/.exec(part)?.at(1)}>
              {/\[([^\]]*)\]/.exec(part)?.at(1)}
            </a>
          )
          : part
      )}
    </p>
  );
};

export default MarkdownDescription;
