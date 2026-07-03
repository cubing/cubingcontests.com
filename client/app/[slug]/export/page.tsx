import Markdown from "react-markdown";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { C, IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { LatestPublicExportDetailsValidator } from "~/helpers/validators/LatestPublicExportDetails.ts";
import { getOrgDetails, getSettingFromDb } from "~/server/server-only-functions.ts";

export const metadata = {
  title: "Exports",
  description: process.env.METADATA_EXPORTS_DESCRIPTION,
};

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function ExportPage({ params }: Props) {
  const { slug } = await params;

  const [publicExportsToKeep, publicExportsReadme, organization] = await Promise.all([
    getSettingFromDb({ key: "public-exports-to-keep", organizationId: null }),
    getSettingFromDb({ key: "public-exports-readme", organizationId: null }),
    getOrgDetails({ slug }),
  ]);

  if (publicExportsToKeep === "0" || (IS_RR_INSTANCE && !organization.subscription))
    return <p className="fs-4 mx-3 mt-5 text-center">Public exports are disabled</p>;
  if (organization.subscription?.plan === "basic")
    return <p className="fs-4 mx-3 mt-5 text-center">Basic plan spaces don't have automated public exports</p>;

  const exportApiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/${slug}/export/${C.publicExportsFormatVersions.at(-1)}/csv`;
  const res = await fetch(`${exportApiUrl}?metadataOnly=true`);
  if (!res.ok) return <LoadingError loadingEntity="the latest public export" />;

  const latestExportDetails = LatestPublicExportDetailsValidator.safeParse(await res.json());
  if (!latestExportDetails.success) return <LoadingError loadingEntity="the latest public export" />;
  const { publicUrl, fileName, exportDate } = latestExportDetails.data;

  return (
    <section className="px-3">
      <h2 className="mb-4 text-center">Public Exports</h2>

      <p>
        Here you can find the latest public exports of {process.env.NEXT_PUBLIC_PROJECT_NAME} data. The exports include
        CSV files for contests, rounds, results, events and persons. The exports also include a <code>README.md</code>{" "}
        file and a <code>metadata.json</code> file.
      </p>

      <p>
        <strong>CSV archive</strong>:{" "}
        <a href={publicUrl} download={fileName} className="me-2">
          {fileName}
        </a>
        (
        <a href={exportApiUrl} download={fileName}>
          permalink
        </a>
        )
      </p>

      <p>
        To always get the latest export for the specified export format version, use the permalink. To only get the
        metadata, add <code>?metadataOnly=true</code> to the permalink URL. Then it will return the export date and the
        download URL for the latest export.
      </p>

      <p>
        <strong>Date of last export</strong>: {new Date(exportDate).toLocaleDateString()}
      </p>

      <div className="mt-5">
        <Markdown>{publicExportsReadme}</Markdown>
      </div>
    </section>
  );
}

export default ExportPage;
