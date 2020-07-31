import React, { useEffect } from "react";

import actions from "actions";
import Alert from "components/js/Alert";
import PageHeader from "components/PageHeader/PageHeader.v2";
import { useDispatch, useSelector } from "react-redux";
import { definedNamespaces } from "../../../shared/Namespace";
import { IStoreState } from "../../../shared/types";
import LoadingWrapper from "../../LoadingWrapper/LoadingWrapper.v2";
import { AppRepoAddButton } from "./AppRepoButton.v2";
import "./AppRepoList.v2.css";
import { AppRepoListItem } from "./AppRepoListItem.v2";
import { AppRepoRefreshAllButton } from "./AppRepoRefreshAllButton.v2";

export interface IAppRepoListProps {
  cluster: string;
  namespace: string;
  kubeappsNamespace: string;
}

function AppRepoList({ cluster, namespace, kubeappsNamespace }: IAppRepoListProps) {
  const dispatch = useDispatch();
  // We do not currently support app repositories on additional clusters.
  const supportedCluster = cluster === "default";

  useEffect(() => {
    if (supportedCluster) {
      dispatch(actions.repos.fetchRepos(namespace));
      dispatch(actions.repos.fetchImagePullSecrets(namespace));
    }
  }, [dispatch, namespace, supportedCluster]);
  const { errors, isFetching, repos, repoSecrets } = useSelector(
    (state: IStoreState) => state.repos,
  );
  const renderNamespace = namespace === definedNamespaces.all;

  return (
    <>
      <PageHeader>
        <div className="app-repo-list-header">
          <h1>Application Repositories</h1>
          <div className="header-button">
            {supportedCluster && (
              <>
                <AppRepoAddButton
                  namespace={namespace}
                  kubeappsNamespace={kubeappsNamespace}
                  primary={true}
                />
                <AppRepoRefreshAllButton />
              </>
            )}
          </div>
        </div>
      </PageHeader>
      {!supportedCluster ? (
        <Alert theme="warning">
          <h5>AppRepositories are available on the default cluster only</h5>
          <p>
            Currently the multi-cluster support in Kubeapps supports AppRepositories on the default
            cluster only.
          </p>
          <p>
            The catalog of charts from AppRepositories on the default cluster which are available
            for all namespaces will be avaialble on additional clusters also, but you can not
            currently create a private AppRepository for a particular namespace of an additional
            cluster. We may in the future support AppRepositories on additional clusters but for now
            you will need to switch back to your default cluster.
          </p>
        </Alert>
      ) : (
        <>
          {errors.fetch && (
            <Alert theme="danger">
              Found an error fetching repositories: {errors.fetch.message}
            </Alert>
          )}
          {errors.delete && (
            <Alert theme="danger">
              Found an error deleting the repository: {errors.delete.message}
            </Alert>
          )}
          {errors.update && (
            <Alert theme="danger">
              Found an error updating the repositories: {errors.update.message}
            </Alert>
          )}
          {!errors.fetch && (
            <>
              <LoadingWrapper loaded={!isFetching}>
                <table>
                  <thead>
                    <tr>
                      <th>Repo</th>
                      {renderNamespace && <th>Namespace</th>}
                      <th>URL</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repos.map(repo => (
                      <AppRepoListItem
                        key={repo.metadata.uid}
                        repo={repo}
                        secret={repoSecrets.find(secret =>
                          secret.metadata.ownerReferences?.some(
                            ownerRef => ownerRef.name === repo.metadata.name,
                          ),
                        )}
                        renderNamespace={renderNamespace}
                        cluster={cluster}
                        namespace={namespace}
                        kubeappsNamespace={kubeappsNamespace}
                      />
                    ))}
                  </tbody>
                </table>
              </LoadingWrapper>
            </>
          )}
        </>
      )}
    </>
  );
}

export default AppRepoList;
