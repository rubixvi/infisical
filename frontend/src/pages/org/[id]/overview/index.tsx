// REFACTOR(akhilmhdh): This file needs to be split into multiple components too complex

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faSlack } from "@fortawesome/free-brands-svg-icons";
import { faFolderOpen, faStar } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowDownAZ,
  faArrowRight,
  faArrowUpRightFromSquare,
  faArrowUpZA,
  faBorderAll,
  faCheck,
  faCheckCircle,
  faClipboard,
  faExclamationCircle,
  faHandPeace,
  faList,
  faMagnifyingGlass,
  faNetworkWired,
  faPlug,
  faPlus,
  faSearch,
  faStar as faSolidStar,
  faUserPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as Tabs from "@radix-ui/react-tabs";

import { createNotification } from "@app/components/notifications";
import { OrgPermissionCan } from "@app/components/permissions";
import onboardingCheck from "@app/components/utilities/checks/OnboardingCheck";
import {
  Button,
  IconButton,
  Input,
  Pagination,
  Skeleton,
  Tooltip,
  UpgradePlanModal
} from "@app/components/v2";
import { NewProjectModal } from "@app/components/v2/projects";
import {
  OrgPermissionActions,
  OrgPermissionSubjects,
  useOrganization,
  useSubscription,
  useUser,
  useWorkspace
} from "@app/context";
import { usePagination, useResetPageHelper } from "@app/hooks";
import { useRegisterUserAction } from "@app/hooks/api";
import { OrderByDirection } from "@app/hooks/api/generic/types";
// import { fetchUserWsKey } from "@app/hooks/api/keys/queries";
import { useFetchServerStatus } from "@app/hooks/api/serverDetails";
import { Workspace } from "@app/hooks/api/types";
import { useUpdateUserProjectFavorites } from "@app/hooks/api/users/mutation";
import { useGetUserProjectFavorites } from "@app/hooks/api/users/queries";
import { usePopUp } from "@app/hooks/usePopUp";

const features = [
  {
    id: 0,
    name: "Kubernetes Operator",
    link: "https://infisical.com/docs/documentation/getting-started/kubernetes",
    description:
      "Pull secrets into your Kubernetes containers and automatically redeploy upon secret changes."
  },
  {
    id: 1,
    name: "Infisical Agent",
    link: "https://infisical.com/docs/infisical-agent/overview",
    description: "Inject secrets into your apps without modifying any application logic."
  }
];

type ItemProps = {
  text: string;
  subText: string;
  complete: boolean;
  icon: IconProp;
  time: string;
  userAction?: string;
  link?: string;
};

enum ProjectsViewMode {
  GRID = "grid",
  LIST = "list"
}

enum ProjectOrderBy {
  Name = "name"
}

function copyToClipboard(id: string, setState: (value: boolean) => void) {
  // Get the text field
  const copyText = document.getElementById(id) as HTMLInputElement;

  // Select the text field
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText.value);

  setState(true);
  setTimeout(() => setState(false), 2000);
  // Alert the copied text
  // alert("Copied the text: " + copyText.value);
}

const CodeItem = ({
  isCopied,
  setIsCopied,
  textExplanation,
  code,
  id
}: {
  isCopied: boolean;
  setIsCopied: (value: boolean) => void;
  textExplanation: string;
  code: string;
  id: string;
}) => {
  return (
    <>
      <p className="mb-2 mt-4 text-sm leading-normal text-bunker-300">{textExplanation}</p>
      <div className="flex flex-row items-center justify-between rounded-md border border-mineshaft-600 bg-bunker px-3 py-2 font-mono text-sm">
        <input disabled value={code} id={id} className="w-full bg-transparent text-bunker-200" />
        <button
          type="button"
          onClick={() => copyToClipboard(id, setIsCopied)}
          className="h-full pl-3.5 pr-2 text-bunker-300 duration-200 hover:text-primary-200"
        >
          {isCopied ? (
            <FontAwesomeIcon icon={faCheck} className="pr-0.5" />
          ) : (
            <FontAwesomeIcon icon={faClipboard} />
          )}
        </button>
      </div>
    </>
  );
};

const TabsObject = () => {
  const [downloadCodeCopied, setDownloadCodeCopied] = useState(false);
  const [downloadCode2Copied, setDownloadCode2Copied] = useState(false);
  const [loginCodeCopied, setLoginCodeCopied] = useState(false);
  const [initCodeCopied, setInitCodeCopied] = useState(false);
  const [runCodeCopied, setRunCodeCopied] = useState(false);

  return (
    <Tabs.Root
      className="flex w-full cursor-default flex-col rounded-md border border-mineshaft-600"
      defaultValue="tab1"
    >
      <Tabs.List
        className="flex shrink-0 border-b border-mineshaft-600"
        aria-label="Manage your account"
      >
        <Tabs.Trigger
          className="flex h-10 flex-1 cursor-default select-none items-center justify-center bg-bunker-700 px-5 text-sm leading-none text-bunker-300 outline-none first:rounded-tl-md last:rounded-tr-md data-[state=active]:border-b data-[state=active]:border-primary data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:focus:relative"
          value="tab1"
        >
          MacOS
        </Tabs.Trigger>
        <Tabs.Trigger
          className="flex h-10 flex-1 cursor-default select-none items-center justify-center bg-bunker-700 px-5 text-sm leading-none text-bunker-300 outline-none first:rounded-tl-md last:rounded-tr-md data-[state=active]:border-b data-[state=active]:border-primary data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:focus:relative"
          value="tab2"
        >
          Windows
        </Tabs.Trigger>
        {/* <Tabs.Trigger
        className="bg-bunker-700 px-5 h-10 flex-1 flex items-center justify-center text-sm leading-none text-bunker-300 select-none first:rounded-tl-md last:rounded-tr-md data-[state=active]:text-primary data-[state=active]:font-medium data-[state=active]:focus:relative data-[state=active]:border-b data-[state=active]:border-primary outline-none cursor-default"
        value="tab3"
      >
        Arch Linux
      </Tabs.Trigger> */}
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 flex-1 cursor-default select-none items-center justify-center bg-bunker-700 px-5 text-sm leading-none text-bunker-300 outline-none duration-200 first:rounded-tl-md last:rounded-tr-md hover:text-bunker-100 data-[state=active]:border-b data-[state=active]:border-primary data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:focus:relative"
          href="https://infisical.com/docs/cli/overview"
        >
          Other Platforms <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2" />
        </a>
      </Tabs.List>
      <Tabs.Content
        className="grow cursor-default rounded-b-md bg-bunker-700 p-5 pt-0 outline-none"
        value="tab1"
      >
        <CodeItem
          isCopied={downloadCodeCopied}
          setIsCopied={setDownloadCodeCopied}
          textExplanation="1. Download CLI"
          code="brew install infisical/get-cli/infisical"
          id="downloadCode"
        />
        <CodeItem
          isCopied={loginCodeCopied}
          setIsCopied={setLoginCodeCopied}
          textExplanation="2. Login"
          code="infisical login"
          id="loginCode"
        />
        <CodeItem
          isCopied={initCodeCopied}
          setIsCopied={setInitCodeCopied}
          textExplanation="3. Choose Project"
          code="infisical init"
          id="initCode"
        />
        <CodeItem
          isCopied={runCodeCopied}
          setIsCopied={setRunCodeCopied}
          textExplanation="4. Done! Now, you can prepend your usual start script with:"
          code="infisical run -- [YOUR USUAL CODE START SCRIPT GOES HERE]"
          id="runCode"
        />
        <p className="mt-2 text-sm text-bunker-300">
          You can find example of start commands for different frameworks{" "}
          <a
            className="text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
            href="https://infisical.com/docs/integrations/overview"
          >
            here
          </a>
          .{" "}
        </p>
      </Tabs.Content>
      <Tabs.Content className="grow rounded-b-md bg-bunker-700 p-5 pt-0 outline-none" value="tab2">
        <CodeItem
          isCopied={downloadCodeCopied}
          setIsCopied={setDownloadCodeCopied}
          textExplanation="1. Download CLI"
          code="scoop bucket add org https://github.com/Infisical/scoop-infisical.git"
          id="downloadCodeW"
        />
        <div className="mt-2 flex flex-row items-center justify-between rounded-md border border-mineshaft-600 bg-bunker px-3 py-2 font-mono text-sm">
          <input
            disabled
            value="scoop install infisical"
            id="downloadCodeW2"
            className="w-full bg-transparent text-bunker-200"
          />
          <button
            type="button"
            onClick={() => copyToClipboard("downloadCodeW2", setDownloadCode2Copied)}
            className="h-full pl-3.5 pr-2 text-bunker-300 duration-200 hover:text-primary-200"
          >
            {downloadCode2Copied ? (
              <FontAwesomeIcon icon={faCheck} className="pr-0.5" />
            ) : (
              <FontAwesomeIcon icon={faClipboard} />
            )}
          </button>
        </div>
        <CodeItem
          isCopied={loginCodeCopied}
          setIsCopied={setLoginCodeCopied}
          textExplanation="2. Login"
          code="infisical login"
          id="loginCodeW"
        />
        <CodeItem
          isCopied={initCodeCopied}
          setIsCopied={setInitCodeCopied}
          textExplanation="3. Choose Project"
          code="infisical init"
          id="initCodeW"
        />
        <CodeItem
          isCopied={runCodeCopied}
          setIsCopied={setRunCodeCopied}
          textExplanation="4. Done! Now, you can prepend your usual start script with:"
          code="infisical run -- [YOUR USUAL CODE START SCRIPT GOES HERE]"
          id="runCodeW"
        />
        <p className="mt-2 text-sm text-bunker-300">
          You can find example of start commands for different frameworks{" "}
          <a
            className="text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
            href="https://infisical.com/docs/integrations/overview"
          >
            here
          </a>
          .{" "}
        </p>
      </Tabs.Content>
    </Tabs.Root>
  );
};

const LearningItem = ({
  text,
  subText,
  complete,
  icon,
  time,
  userAction,
  link
}: ItemProps): JSX.Element => {
  const registerUserAction = useRegisterUserAction();
  if (link) {
    return (
      <a
        target={`${link.includes("https") ? "_blank" : "_self"}`}
        rel="noopener noreferrer"
        className={`w-full ${complete && "opacity-30 duration-200 hover:opacity-100"}`}
        href={link}
      >
        <div
          className={`${
            complete ? "bg-gradient-to-r from-primary-500/70 p-[0.07rem]" : ""
          } mb-3 rounded-md`}
        >
          <div
            onKeyDown={() => null}
            role="button"
            tabIndex={0}
            onClick={async () => {
              if (userAction && userAction !== "first_time_secrets_pushed") {
                await registerUserAction.mutateAsync(userAction);
              }
            }}
            className={`group relative flex h-[5.5rem] w-full items-center justify-between overflow-hidden rounded-md border ${
              complete
                ? "cursor-default border-mineshaft-900 bg-gradient-to-r from-[#0e1f01] to-mineshaft-700"
                : "cursor-pointer border-mineshaft-600 bg-mineshaft-800 shadow-xl hover:bg-mineshaft-700"
            } text-mineshaft-100 duration-200`}
          >
            <div className="mr-4 flex flex-row items-center">
              <FontAwesomeIcon icon={icon} className="mx-2 w-16 text-4xl" />
              {complete && (
                <div className="absolute left-12 top-10 flex h-7 w-7 items-center justify-center rounded-full bg-bunker-500 p-2 group-hover:bg-mineshaft-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-4xl text-primary" />
                </div>
              )}
              <div className="flex flex-col items-start">
                <div className="mt-0.5 text-xl font-semibold">{text}</div>
                <div className="text-sm font-normal">{subText}</div>
              </div>
            </div>
            <div
              className={`w-32 pr-8 text-right text-sm font-semibold ${complete && "text-primary"}`}
            >
              {complete ? "Complete!" : `About ${time}`}
            </div>
            {/* {complete && <div className="absolute bottom-0 left-0 h-1 w-full bg-primary" />} */}
          </div>
        </div>
      </a>
    );
  }
  return (
    <div
      onKeyDown={() => null}
      role="button"
      tabIndex={0}
      onClick={async () => {
        if (userAction) {
          await registerUserAction.mutateAsync(userAction);
        }
      }}
      className="relative my-1.5 flex h-[5.5rem] w-full cursor-pointer items-center justify-between overflow-hidden rounded-md border border-dashed border-bunker-400 bg-bunker-700 py-2 pl-2 pr-6 shadow-xl duration-200 hover:bg-bunker-500"
    >
      <div className="mr-4 flex flex-row items-center">
        <FontAwesomeIcon icon={icon} className="mx-2 w-16 text-4xl" />
        {complete && (
          <div className="absolute left-11 top-10 h-7 w-7 rounded-full bg-bunker-700">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="absolute left-12 top-16 h-5 w-5 text-4xl text-primary"
            />
          </div>
        )}
        <div className="flex flex-col items-start">
          <div className="mt-0.5 text-xl font-semibold">{text}</div>
          <div className="mt-0.5 text-sm font-normal">{subText}</div>
        </div>
      </div>
      <div className={`w-28 pr-4 text-right text-sm font-semibold ${complete && "text-primary"}`}>
        {complete ? "Complete!" : `About ${time}`}
      </div>
      {complete && <div className="absolute bottom-0 left-0 h-1 w-full bg-primary" />}
    </div>
  );
};

const LearningItemSquare = ({
  text,
  subText,
  complete,
  icon,
  time,
  userAction,
  link
}: ItemProps): JSX.Element => {
  const registerUserAction = useRegisterUserAction();
  return (
    <a
      target={`${link?.includes("https") ? "_blank" : "_self"}`}
      rel="noopener noreferrer"
      className={`w-full ${complete && "opacity-30 duration-200 hover:opacity-100"}`}
      href={link}
    >
      <div
        className={`${
          complete ? "bg-gradient-to-r from-primary-500/70 p-[0.07rem]" : ""
        } w-full rounded-md`}
      >
        <div
          onKeyDown={() => null}
          role="button"
          tabIndex={0}
          onClick={async () => {
            if (userAction && userAction !== "first_time_secrets_pushed") {
              await registerUserAction.mutateAsync(userAction);
            }
          }}
          className={`group relative flex w-full items-center justify-between overflow-hidden rounded-md border ${
            complete
              ? "cursor-default border-mineshaft-900 bg-gradient-to-r from-[#0e1f01] to-mineshaft-700"
              : "cursor-pointer border-mineshaft-600 bg-mineshaft-800 shadow-xl hover:bg-mineshaft-700"
          } text-mineshaft-100 duration-200`}
        >
          <div className="flex w-full flex-col items-center px-6 py-4">
            <div className="flex w-full flex-row items-start justify-between">
              <FontAwesomeIcon
                icon={icon}
                className="w-16 pt-2 text-5xl text-mineshaft-200 duration-100 group-hover:text-mineshaft-100"
              />
              {complete && (
                <div className="absolute left-14 top-12 flex h-7 w-7 items-center justify-center rounded-full bg-bunker-500 p-2 group-hover:bg-mineshaft-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-4xl text-primary" />
                </div>
              )}
              <div
                className={`text-right text-sm font-normal text-mineshaft-300 ${
                  complete ? "font-semibold text-primary" : ""
                }`}
              >
                {complete ? "Complete!" : `About ${time}`}
              </div>
            </div>
            <div className="flex w-full flex-col items-start justify-start pt-4">
              <div className="mt-0.5 text-lg font-medium">{text}</div>
              <div className="text-sm font-normal text-mineshaft-300">{subText}</div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

// #TODO: Update all the workspaceIds
const OrganizationPage = () => {
  const { t } = useTranslation();

  const router = useRouter();

  const { workspaces, isLoading: isWorkspaceLoading } = useWorkspace();
  const { currentOrg } = useOrganization();
  const routerOrgId = String(router.query.id);
  const orgWorkspaces = workspaces?.filter((workspace) => workspace.orgId === routerOrgId) || [];
  const { data: projectFavorites, isLoading: isProjectFavoritesLoading } =
    useGetUserProjectFavorites(currentOrg?.id!);
  const { mutateAsync: updateUserProjectFavorites } = useUpdateUserProjectFavorites();

  const isProjectViewLoading = isWorkspaceLoading || isProjectFavoritesLoading;

  const { popUp, handlePopUpOpen, handlePopUpToggle } = usePopUp([
    "addNewWs",
    "upgradePlan"
  ] as const);

  const [hasUserClickedSlack, setHasUserClickedSlack] = useState(false);
  const [hasUserClickedIntro, setHasUserClickedIntro] = useState(false);
  const [hasUserPushedSecrets, setHasUserPushedSecrets] = useState(false);
  const [usersInOrg, setUsersInOrg] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const { user } = useUser();
  const { data: serverDetails } = useFetchServerStatus();
  const [projectsViewMode, setProjectsViewMode] = useState<ProjectsViewMode>(
    (localStorage.getItem("projectsViewMode") as ProjectsViewMode) || ProjectsViewMode.GRID
  );

  const { subscription } = useSubscription();

  const isAddingProjectsAllowed = subscription?.workspaceLimit
    ? subscription.workspacesUsed < subscription.workspaceLimit
    : true;

  useEffect(() => {
    onboardingCheck({
      orgId: routerOrgId,
      setHasUserClickedIntro,
      setHasUserClickedSlack,
      setHasUserPushedSecrets,
      setUsersInOrg
    });
  }, []);

  const isWorkspaceEmpty = !isProjectViewLoading && orgWorkspaces?.length === 0;

  const {
    setPage,
    perPage,
    setPerPage,
    page,
    offset,
    limit,
    toggleOrderDirection,
    orderDirection
  } = usePagination(ProjectOrderBy.Name, { initPerPage: 24 });

  const filteredWorkspaces = useMemo(
    () =>
      orgWorkspaces
        .filter((ws) => ws?.name?.toLowerCase().includes(searchFilter.toLowerCase()))
        .sort((a, b) =>
          orderDirection === OrderByDirection.ASC
            ? a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            : b.name.toLowerCase().localeCompare(a.name.toLowerCase())
        ),
    [searchFilter, page, perPage, orderDirection, offset, limit]
  );

  useResetPageHelper({
    setPage,
    offset,
    totalCount: filteredWorkspaces.length
  });

  const { workspacesWithFaveProp } = useMemo(() => {
    const workspacesWithFav = filteredWorkspaces
      .map((w): Workspace & { isFavorite: boolean } => ({
        ...w,
        isFavorite: Boolean(projectFavorites?.includes(w.id))
      }))
      .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite))
      .slice(offset, limit * page);

    return {
      workspacesWithFaveProp: workspacesWithFav
    };
  }, [filteredWorkspaces, projectFavorites]);

  const addProjectToFavorites = async (projectId: string) => {
    try {
      if (currentOrg?.id) {
        await updateUserProjectFavorites({
          orgId: currentOrg?.id,
          projectFavorites: [...(projectFavorites || []), projectId]
        });
      }
    } catch (err) {
      createNotification({
        text: "Failed to add project to favorites.",
        type: "error"
      });
    }
  };

  const removeProjectFromFavorites = async (projectId: string) => {
    try {
      if (currentOrg?.id) {
        await updateUserProjectFavorites({
          orgId: currentOrg?.id,
          projectFavorites: [...(projectFavorites || []).filter((entry) => entry !== projectId)]
        });
      }
    } catch (err) {
      createNotification({
        text: "Failed to remove project from favorites.",
        type: "error"
      });
    }
  };

  const renderProjectGridItem = (workspace: Workspace, isFavorite: boolean) => (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      onClick={() => {
        router.push(`/project/${workspace.id}/secrets/overview`);
        localStorage.setItem("projectData.id", workspace.id);
      }}
      key={workspace.id}
      className="min-w-72 flex h-40 cursor-pointer flex-col rounded-md border border-mineshaft-600 bg-mineshaft-800 p-4"
    >
      <div className="flex flex-row justify-between">
        <div className="mt-0 truncate text-lg text-mineshaft-100">{workspace.name}</div>
        {isFavorite ? (
          <FontAwesomeIcon
            icon={faSolidStar}
            className="text-sm text-yellow-600 hover:text-mineshaft-400"
            onClick={(e) => {
              e.stopPropagation();
              removeProjectFromFavorites(workspace.id);
            }}
          />
        ) : (
          <FontAwesomeIcon
            icon={faStar}
            className="text-sm text-mineshaft-400 hover:text-mineshaft-300"
            onClick={(e) => {
              e.stopPropagation();
              addProjectToFavorites(workspace.id);
            }}
          />
        )}
      </div>

      <div
        className="mt-1 mb-2.5 grow text-sm text-mineshaft-300"
        style={{
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2
        }}
      >
        {workspace.description}
      </div>

      <div className="flex w-full flex-row items-end justify-between place-self-end">
        <div className="mt-0 text-xs text-mineshaft-400">
          {workspace.environments?.length || 0} environments
        </div>
        <button type="button">
          <div className="group ml-auto w-max cursor-pointer rounded-full border border-mineshaft-600 bg-mineshaft-900 py-2 px-4 text-sm text-mineshaft-300 transition-all hover:border-primary-500/80 hover:bg-primary-800/20 hover:text-mineshaft-200">
            Explore{" "}
            <FontAwesomeIcon
              icon={faArrowRight}
              className="pl-1.5 pr-0.5 duration-200 hover:pl-2 hover:pr-0"
            />
          </div>
        </button>
      </div>
    </div>
  );

  const renderProjectListItem = (workspace: Workspace, isFavorite: boolean, index: number) => (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      onClick={() => {
        router.push(`/project/${workspace.id}/secrets/overview`);
        localStorage.setItem("projectData.id", workspace.id);
      }}
      key={workspace.id}
      className={`min-w-72 group grid h-14 cursor-pointer grid-cols-6 border-t border-l border-r border-mineshaft-600 bg-mineshaft-800 px-6 hover:bg-mineshaft-700 ${
        index === 0 && "rounded-t-md"
      }`}
    >
      <div className="flex items-center sm:col-span-3 lg:col-span-4">
        <div className="truncate text-sm text-mineshaft-100">{workspace.name}</div>
      </div>
      <div className="flex items-center justify-end sm:col-span-3 lg:col-span-2">
        <div className="text-center text-sm text-mineshaft-300">
          {workspace.environments?.length || 0} environments
        </div>
        {isFavorite ? (
          <FontAwesomeIcon
            icon={faSolidStar}
            className="ml-6 text-sm text-yellow-600 hover:text-mineshaft-400"
            onClick={(e) => {
              e.stopPropagation();
              removeProjectFromFavorites(workspace.id);
            }}
          />
        ) : (
          <FontAwesomeIcon
            icon={faStar}
            className="ml-6 text-sm text-mineshaft-400 hover:text-mineshaft-300"
            onClick={(e) => {
              e.stopPropagation();
              addProjectToFavorites(workspace.id);
            }}
          />
        )}
      </div>
    </div>
  );

  let projectsComponents: ReactNode;

  if (filteredWorkspaces.length || isProjectViewLoading) {
    switch (projectsViewMode) {
      case ProjectsViewMode.GRID:
        projectsComponents = (
          <div className="mt-4 grid w-full grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {isProjectViewLoading &&
              Array.apply(0, Array(3)).map((_x, i) => (
                <div
                  key={`workspace-cards-loading-${i + 1}`}
                  className="min-w-72 flex h-40 flex-col justify-between rounded-md border border-mineshaft-600 bg-mineshaft-800 p-4"
                >
                  <div className="mt-0 text-lg text-mineshaft-100">
                    <Skeleton className="w-3/4 bg-mineshaft-600" />
                  </div>
                  <div className="mt-0 pb-6 text-sm text-mineshaft-300">
                    <Skeleton className="w-1/2 bg-mineshaft-600" />
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="w-1/2 bg-mineshaft-600" />
                  </div>
                </div>
              ))}
            {!isProjectViewLoading && (
              <>
                {workspacesWithFaveProp.map((workspace) =>
                  renderProjectGridItem(workspace, workspace.isFavorite)
                )}
              </>
            )}
          </div>
        );

        break;
      case ProjectsViewMode.LIST:
      default:
        projectsComponents = (
          <div className="mt-4 w-full rounded-md">
            {isProjectViewLoading &&
              Array.apply(0, Array(3)).map((_x, i) => (
                <div
                  key={`workspace-cards-loading-${i + 1}`}
                  className={`min-w-72 group flex h-12 cursor-pointer flex-row items-center justify-between border border-mineshaft-600 bg-mineshaft-800 px-6 hover:bg-mineshaft-700 ${
                    i === 0 && "rounded-t-md"
                  } ${i === 2 && "rounded-b-md border-b"}`}
                >
                  <Skeleton className="w-full bg-mineshaft-600" />
                </div>
              ))}
            {!isProjectViewLoading &&
              workspacesWithFaveProp.map((workspace, ind) =>
                renderProjectListItem(workspace, workspace.isFavorite, ind)
              )}
          </div>
        );
        break;
    }
  } else if (orgWorkspaces.length) {
    projectsComponents = (
      <div className="mt-4 w-full rounded-md border border-mineshaft-700 bg-mineshaft-800 px-4 py-6 text-base text-mineshaft-300">
        <FontAwesomeIcon
          icon={faSearch}
          className="mb-4 mt-2 w-full text-center text-5xl text-mineshaft-400"
        />
        <div className="text-center font-light">No projects match search...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col justify-start bg-bunker-800 md:h-screen">
      <Head>
        <title>{t("common.head-title", { title: t("settings.members.title") })}</title>
        <link rel="icon" href="/infisical.ico" />
      </Head>
      {!serverDetails?.redisConfigured && (
        <div className="mb-4 flex flex-col items-start justify-start px-6 py-6 pb-0 text-3xl">
          <p className="mr-4 mb-4 font-semibold text-white">Announcements</p>
          <div className="flex w-full items-center rounded-md border border-blue-400/70 bg-blue-900/70 p-2 text-base text-mineshaft-100">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="mr-4 p-4 text-2xl text-mineshaft-50"
            />
            Attention: Updated versions of Infisical now require Redis for full functionality. Learn
            how to configure it
            <Link
              href="https://infisical.com/docs/self-hosting/configuration/redis"
              target="_blank"
            >
              <span className="cursor-pointer pl-1 text-white underline underline-offset-2 duration-100 hover:text-blue-200 hover:decoration-blue-400">
                here
              </span>
            </Link>
            .
          </div>
        </div>
      )}
      <div className="mb-4 flex flex-col items-start justify-start px-6 py-6 pb-0 text-3xl">
        <div className="flex w-full justify-between">
          <p className="mr-4 font-semibold text-white">Projects</p>
        </div>
        <div className="mt-6 flex w-full flex-row">
          <Input
            className="h-[2.3rem] bg-mineshaft-800 text-sm placeholder-mineshaft-50 duration-200 focus:bg-mineshaft-700/80"
            placeholder="Search by project name..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            leftIcon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
          />
          <div className="ml-2 flex rounded-md border border-mineshaft-600 bg-mineshaft-800 p-1">
            <Tooltip content="Toggle Sort Direction">
              <IconButton
                className="min-w-[2.4rem] border-none hover:bg-mineshaft-600"
                ariaLabel={`Sort ${
                  orderDirection === OrderByDirection.ASC ? "descending" : "ascending"
                }`}
                variant="plain"
                size="xs"
                colorSchema="secondary"
                onClick={toggleOrderDirection}
              >
                <FontAwesomeIcon
                  icon={orderDirection === OrderByDirection.ASC ? faArrowDownAZ : faArrowUpZA}
                />
              </IconButton>
            </Tooltip>
          </div>
          <div className="ml-2 flex rounded-md border border-mineshaft-600 bg-mineshaft-800 p-1">
            <IconButton
              variant="outline_bg"
              onClick={() => {
                localStorage.setItem("projectsViewMode", ProjectsViewMode.GRID);
                setProjectsViewMode(ProjectsViewMode.GRID);
              }}
              ariaLabel="grid"
              size="xs"
              className={`${
                projectsViewMode === ProjectsViewMode.GRID ? "bg-mineshaft-500" : "bg-transparent"
              } min-w-[2.4rem] border-none hover:bg-mineshaft-600`}
            >
              <FontAwesomeIcon icon={faBorderAll} />
            </IconButton>
            <IconButton
              variant="outline_bg"
              onClick={() => {
                localStorage.setItem("projectsViewMode", ProjectsViewMode.LIST);
                setProjectsViewMode(ProjectsViewMode.LIST);
              }}
              ariaLabel="list"
              size="xs"
              className={`${
                projectsViewMode === ProjectsViewMode.LIST ? "bg-mineshaft-500" : "bg-transparent"
              } min-w-[2.4rem] border-none hover:bg-mineshaft-600`}
            >
              <FontAwesomeIcon icon={faList} />
            </IconButton>
          </div>
          <OrgPermissionCan I={OrgPermissionActions.Create} an={OrgPermissionSubjects.Workspace}>
            {(isAllowed) => (
              <Button
                isDisabled={!isAllowed}
                colorSchema="primary"
                leftIcon={<FontAwesomeIcon icon={faPlus} />}
                onClick={() => {
                  if (isAddingProjectsAllowed) {
                    handlePopUpOpen("addNewWs");
                  } else {
                    handlePopUpOpen("upgradePlan");
                  }
                }}
                className="ml-2"
              >
                Add New Project
              </Button>
            )}
          </OrgPermissionCan>
        </div>
        {projectsComponents}
        {!isProjectViewLoading && Boolean(filteredWorkspaces.length) && (
          <Pagination
            className={
              projectsViewMode === ProjectsViewMode.GRID
                ? "col-span-full !justify-start border-transparent bg-transparent pl-2"
                : "rounded-b-md border border-mineshaft-600"
            }
            perPage={perPage}
            perPageList={[12, 24, 48, 96]}
            count={filteredWorkspaces.length}
            page={page}
            onChangePage={setPage}
            onChangePerPage={setPerPage}
          />
        )}
        {isWorkspaceEmpty && (
          <div className="mt-4 w-full rounded-md border border-mineshaft-700 bg-mineshaft-800 px-4 py-6 text-base text-mineshaft-300">
            <FontAwesomeIcon
              icon={faFolderOpen}
              className="mb-4 mt-2 w-full text-center text-5xl text-mineshaft-400"
            />
            <div className="text-center font-light">
              You are not part of any projects in this organization yet. When you are, they will
              appear here.
            </div>
            <div className="mt-0.5 text-center font-light">
              Create a new project, or ask other organization members to give you necessary
              permissions.
            </div>
          </div>
        )}
      </div>
      <div className="mb-4 flex flex-col items-start justify-start px-6 py-6 pb-6 text-3xl">
        <p className="mr-4 font-semibold text-white">Explore Infisical</p>
        <div className="mt-4 grid w-full grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="relative flex h-full w-full flex-col gap-2 overflow-auto rounded-md border border-mineshaft-600 bg-mineshaft-800 p-4"
            >
              <div className="mt-0 text-lg text-mineshaft-100">{feature.name}</div>
              <div className="line-clamp overflwo-auto mb-4 mt-2 h-full text-[15px] font-light text-mineshaft-300">
                {feature.description}
              </div>
              <div className="flex w-full flex-col items-start gap-2 xl:flex-row xl:items-center">
                <p className="left-0 text-[15px] font-light text-mineshaft-300">
                  Setup time: 20 min
                </p>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group ml-0 w-max cursor-default rounded-full border border-mineshaft-600 bg-mineshaft-900 py-2 px-4 text-sm text-mineshaft-300 transition-all hover:border-primary-500/80 hover:bg-primary-800/20 hover:text-mineshaft-200 xl:ml-auto"
                  href={feature.link}
                >
                  Learn more{" "}
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="s pl-1.5 pr-0.5 duration-200 group-hover:pl-2 group-hover:pr-0"
                  />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      {!(new Date().getTime() - new Date(user?.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000) && (
        <div className="mb-4 flex flex-col items-start justify-start px-6 pb-0 text-3xl">
          <p className="mr-4 mb-4 font-semibold text-white">Onboarding Guide</p>
          <div className="mb-3 grid w-full grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <LearningItemSquare
              text="Watch Infisical demo"
              subText="Set up Infisical in 3 min."
              complete={hasUserClickedIntro}
              icon={faHandPeace}
              time="3 min"
              userAction="intro_cta_clicked"
              link="https://www.youtube.com/watch?v=PK23097-25I"
            />
            {orgWorkspaces.length !== 0 && (
              <>
                <LearningItemSquare
                  text="Add your secrets"
                  subText="Drop a .env file or type your secrets."
                  complete={hasUserPushedSecrets}
                  icon={faPlus}
                  time="1 min"
                  userAction="first_time_secrets_pushed"
                  link={`/project/${orgWorkspaces[0]?.id}/secrets/overview`}
                />
                <LearningItemSquare
                  text="Invite your teammates"
                  subText="Infisical is better used as a team."
                  complete={usersInOrg}
                  icon={faUserPlus}
                  time="2 min"
                  link={`/org/${router.query.id}/members?action=invite`}
                />
              </>
            )}
            <div className="block xl:hidden 2xl:block">
              <LearningItemSquare
                text="Join Infisical Slack"
                subText="Have any questions? Ask us!"
                complete={hasUserClickedSlack}
                icon={faSlack}
                time="1 min"
                userAction="slack_cta_clicked"
                link="https://infisical.com/slack"
              />
            </div>
          </div>
          {orgWorkspaces.length !== 0 && (
            <div className="group relative mb-3 flex h-full w-full cursor-default flex-col items-center justify-between overflow-hidden rounded-md border border-mineshaft-600 bg-mineshaft-800 pl-2 pr-2 pt-4 pb-2 text-mineshaft-100 shadow-xl duration-200">
              <div className="mb-4 flex w-full flex-row items-center pr-4">
                <div className="mr-4 flex w-full flex-row items-center">
                  <FontAwesomeIcon icon={faNetworkWired} className="mx-2 w-16 text-4xl" />
                  {false && (
                    <div className="absolute left-12 top-10 flex h-7 w-7 items-center justify-center rounded-full bg-bunker-500 p-2 group-hover:bg-mineshaft-700">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="h-5 w-5 text-4xl text-green"
                      />
                    </div>
                  )}
                  <div className="flex flex-col items-start pl-0.5">
                    <div className="mt-0.5 text-xl font-semibold">Inject secrets locally</div>
                    <div className="text-sm font-normal">
                      Replace .env files with a more secure and efficient alternative.
                    </div>
                  </div>
                </div>
                <div
                  className={`w-28 pr-4 text-right text-sm font-semibold ${false && "text-green"}`}
                >
                  About 2 min
                </div>
              </div>
              <TabsObject />
              {false && <div className="absolute bottom-0 left-0 h-1 w-full bg-green" />}
            </div>
          )}
          {orgWorkspaces.length !== 0 && (
            <LearningItem
              text="Integrate Infisical with your infrastructure"
              subText="Connect Infisical to various 3rd party services and platforms."
              complete={false}
              icon={faPlug}
              time="15 min"
              link="https://infisical.com/docs/integrations/overview"
            />
          )}
        </div>
      )}
      <NewProjectModal
        isOpen={popUp.addNewWs.isOpen}
        onOpenChange={(isOpen) => handlePopUpToggle("addNewWs", isOpen)}
      />
      <UpgradePlanModal
        isOpen={popUp.upgradePlan.isOpen}
        onOpenChange={(isOpen) => handlePopUpToggle("upgradePlan", isOpen)}
        text="You have exceeded the number of projects allowed on the free plan."
      />
      {/* <DeleteUserDialog isOpen={isDeleteOpen} closeModal={closeDeleteModal} submitModal={deleteMembership} userIdToBeDeleted={userIdToBeDeleted}/> */}
    </div>
  );
};

Object.assign(OrganizationPage, { requireAuth: true });

export default OrganizationPage;
