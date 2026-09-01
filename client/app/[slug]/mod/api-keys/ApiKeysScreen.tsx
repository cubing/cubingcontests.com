"use client";

import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAction } from "next-safe-action/hooks";
import { useContext, useState } from "react";
import ContestSelect from "~/app/components/form/ContestSelect.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { authClient } from "~/helpers/auth-client.ts";
import { MainContext } from "~/helpers/contexts.ts";
import type { ContestApiKey, ListPageMode } from "~/helpers/types.ts";
import { getActionError, getFormattedDate } from "~/helpers/utility-functions.ts";
import type { ContestResponse } from "~/server/db/schema/contests.ts";
import { createApiKeySF } from "~/server/server-functions/user-server-functions.ts";

type Props = {
  contests: ContestResponse[];
  apiKeys: ContestApiKey[];
};

function ManageApiKeysScreen({ contests, apiKeys: initApiKeys }: Props) {
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createApiKey, isPending: isCreating } = useAction(createApiKeySF);

  const [mode, setMode] = useState<ListPageMode>("view");
  const [apiKeys, setApiKeys] = useState(initApiKeys);
  const [contestName, setContestName] = useState("");
  const [contest, setContest] = useState<ContestResponse | null>(null);
  const [keyName, setKeyName] = useState("");
  const [loadingId, setLoadingId] = useState("");

  const isPending = isCreating || Boolean(loadingId);

  const handleCreateApiKey = async () => {
    if (!contest) {
      changeErrorMessages(["Please select a contest"]);
      return;
    }

    resetMessages();
    const res = await createApiKey({ competitionId: contest.competitionId, keyName });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      changeSuccessMessage(
        `API key created successfully! If you lose the key, you can delete it and generate a new one on this page.\n\n${res.data!.key}`,
      );
      setMode("view");
      setContestName("");
      setContest(null);
      setApiKeys((prev) => [res.data!.apiKey, ...prev]);
    }
  };

  const onCreateKey = () => {
    resetMessages();
    setMode("add");
    setContestName("");
    setContest(null);
    setKeyName("");
  };

  const onDeleteKey = async (id: string) => {
    setLoadingId(`delete_key_${id}_button`);
    resetMessages();
    const { error } = await authClient.apiKey.delete({ configId: "contest_keys", keyId: id });

    if (error) {
      changeErrorMessages([error.message ?? error.statusText]);
    } else {
      changeSuccessMessage("Successfully deleted API key");
      setApiKeys(apiKeys.filter((key) => key.id !== id));
    }
    setLoadingId("");
  };

  const cancel = () => {
    setMode("view");
    resetMessages();
  };

  return (
    <>
      {mode === "view" ? (
        <Button onClick={onCreateKey} className="btn-success btn-sm mx-2" disabled={contests.length === 0}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create API Key
        </Button>
      ) : (
        <Form
          onSubmit={handleCreateApiKey}
          onCancel={cancel}
          isLoading={isCreating}
          disableControls={isPending}
          hideToasts
        >
          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <ContestSelect
                contestName={contestName}
                setContestName={setContestName}
                setContest={setContest}
                disabled={isPending}
              />
            </div>
            <div className="col-12 col-md-6 mb-3">
              <FormTextInput title="Key name" value={keyName} setValue={setKeyName} disabled={isPending} />
            </div>
          </div>
        </Form>
      )}

      <div className="table-responsive my-3">
        <table className="table-hover table text-nowrap">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Competition</th>
              <th scope="col">Competition ID</th>
              <th scope="col">Daily rate limit</th>
              <th scope="col">Created</th>
              <th scope="col">Expires</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>{contests.find((c) => c.competitionId === key.metadata.competitionId)?.name}</td>
                <td>{key.metadata.competitionId}</td>
                <td>{key.rateLimitMax}</td>
                <td>{getFormattedDate(key.createdAt)}</td>
                <td>{key.expiresAt ? getFormattedDate(key.expiresAt) : ""}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      id={`delete_key_${key.id}_button`}
                      onClick={() => onDeleteKey(key.id)}
                      loadingId={loadingId}
                      disabled={isPending}
                      className="btn-danger btn-xs"
                      title="Delete"
                      ariaLabel="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ManageApiKeysScreen;
